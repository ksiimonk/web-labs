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
router.get("/", async (req, res) => {
    try {
        const users = await User.findAll();
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ error: "Ошибка при получении пользователей", details: error.message });
    }
});

module.exports = router;