const express = require("express");
const router = express.Router();
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const { sendSecurityAlert } = require("../utils/emailSender");

/**
 * @swagger
 * components:
 *   schemas:
 *     UserAuth:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - password
 *       properties:
 *         name:
 *           type: string
 *         email:
 *           type: string
 *         password:
 *           type: string
 *     UserLogin:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *         password:
 *           type: string
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Регистрация пользователя
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserAuth'
 *     responses:
 *       201:
 *         description: Пользователь зарегистрирован
 */
router.post("/register", async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(412).json({ error: "Заполните все поля" });
        }

        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: "Email уже используется" });
        }

        const user = await User.create({ name, email, password });
        res.status(201).json({ id: user.id, email: user.email });
    } catch (error) {
        res.status(500).json({ error: "Ошибка регистрации", details: error.message });
    }
});

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Вход в систему
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserLogin'
 *     responses:
 *       200:
 *         description: Успешный вход
 */
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(412).json({ error: "Укажите email и пароль" });
        }

        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(404).json({ error: "Пользователь не найден" });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ error: "Неверный пароль" });
        }

        // Получение данных устройства
        const clientIp = req.headers["x-forwarded-for"] || req.ip;
        const userAgent = User.hashDevice(req.headers["user-agent"] || "Unknown");
        let securityAlert = false;

        // Проверка истории
        const isNewIp = !user.ipHistory.includes(clientIp);
        const isNewDevice = !user.deviceHistory.includes(userAgent);

        // Отправка уведомления
        if ((isNewIp || isNewDevice) && user.notificationPreferences.newDeviceAlert) {
            try {
                await sendSecurityAlert(user.email, clientIp, userAgent);
                securityAlert = true;
            } catch (emailError) {
                console.error("Ошибка отправки email:", emailError);
            }
        }

        // Обновление истории
        await user.update({
            ipHistory: [...new Set([clientIp, ...user.ipHistory.slice(0, 4)])],
            deviceHistory: [...new Set([userAgent, ...user.deviceHistory.slice(0, 4)])],
            lastLoginIp: clientIp,
        });

        // Генерация токена
        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: "1h" });

        res.json({ 
            token,
            securityAlert,
            user: {
                id: user.id,
                email: user.email,
                name: user.name
            }
        });
    } catch (error) {
        res.status(500).json({ 
            error: "Ошибка входа", 
            details: error.message,
            stack: process.env.NODE_ENV === "development" ? error.stack : undefined
        });
    }
});

module.exports = router;