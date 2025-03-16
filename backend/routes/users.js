const express = require("express");
const User = require("../models/User");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: API для управления пользователями
 */

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Получить список всех пользователей
 *     description: Возвращает список зарегистрированных пользователей в системе.
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Список пользователей успешно получен
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       500:
 *         description: Внутренняя ошибка сервера
 */

//  Получить список пользователей
router.get("/", async (req, res) => {
    try {
        const users = await User.findAll();
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ error: "Ошибка при получении пользователей", details: error.message });
    }
});

/**
 * @swagger
 * /users:
 *   post:
 *     summary: Создать нового пользователя
 *     description: Регистрирует нового пользователя в системе.
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserInput'
 *     responses:
 *       201:
 *         description: Пользователь успешно создан
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       412:
 *         description: Ошибка в данных (например, email уже используется)
 *       500:
 *         description: Внутренняя ошибка сервера
 */

//  Создать нового пользователя
router.post("/", async (req, res) => {
    try {
        const { name, email } = req.body;

        // Проверяем обязательные поля
        if (!name || !email) {
            return res.status(412).json({ error: "Имя и email обязательны для заполнения" });
        }

        // Проверяем уникальность email
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: "Пользователь с таким email уже существует" });
        }

        // Создаём нового пользователя
        const user = await User.create({ name, email });
        res.status(201).json(user);
    } catch (error) {
        res.status(500).json({ error: "Ошибка при создании пользователя", details: error.message });
    }
});

module.exports = router;
