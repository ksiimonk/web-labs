const express = require("express");
const { Op } = require("sequelize");
const Event = require("../models/Event");
const passport = require("passport");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Events
 *   description: API для управления мероприятиями
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Event:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         date:
 *           type: string
 *           format: date-time
 *         createdBy:
 *           type: string
 *           format: uuid
 *       required:
 *         - title
 *         - date
 *         - createdBy
 * 
 *     EventUpdate:
 *       type: object
 *       properties:
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         date:
 *           type: string
 *           format: date
 */

/**
 * @swagger
 * /events:
 *   get:
 *     summary: Получить список всех мероприятий
 *     description: Возвращает все мероприятия, зарегистрированные в системе. Можно фильтровать по диапазону дат.
 *     tags: [Events]
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         required: false
 *         description: Начальная дата для фильтрации мероприятий (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         required: false
 *         description: Конечная дата для фильтрации мероприятий (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Список мероприятий успешно получен
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Event'
 *       400:
 *         description: Некорректный формат даты
 *       500:
 *         description: Внутренняя ошибка сервера
 */
router.get("/", async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        let filter = {};

        if (startDate) {
            const parsedStartDate = new Date(startDate);
            if (isNaN(parsedStartDate.getTime())) {
                return res.status(400).json({ error: "Некорректный формат начальной даты" });
            }
            filter.date = { [Op.gte]: parsedStartDate };
        }

        if (endDate) {
            const parsedEndDate = new Date(endDate);
            if (isNaN(parsedEndDate.getTime())) {
                return res.status(400).json({ error: "Некорректный формат конечной даты" });
            }
            filter.date = { ...filter.date, [Op.lte]: parsedEndDate };
        }

        const events = await Event.findAll({ where: filter });
        return res.json(events);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Ошибка сервера", details: error.message });
    }
});

/**
 * @swagger
 * /events/{id}:
 *   get:
 *     summary: Получение мероприятия по ID
 *     description: Возвращает данные о конкретном мероприятии по его ID.
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: Уникальный идентификатор мероприятия
 *     responses:
 *       200:
 *         description: Мероприятие найдено
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Event'
 *       404:
 *         description: Мероприятие не найдено
 *       500:
 *         description: Ошибка сервера
 */
router.get("/:id", async (req, res) => {
    try {
        const event = await Event.findByPk(req.params.id);
        if (!event) {
            return res.status(404).json({ error: "Мероприятие не найдено" });
        }
        res.status(200).json(event);
    } catch (error) {
        res.status(500).json({ error: "Ошибка при поиске мероприятия", details: error.message });
    }
});

/**
 * @swagger
 * /events:
 *   post:
 *     security:
 *       - bearerAuth: []
 *     summary: Создать новое мероприятие
 *     description: Создает новое мероприятие в системе.
 *     tags: [Events]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Event'
 *     responses:
 *       201:
 *         description: Мероприятие успешно создано
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Event'
 *       400:
 *         description: Некорректные данные
 *       412:
 *         description: Не заполнены обязательные поля
 *       500:
 *         description: Внутренняя ошибка сервера
 */
router.post("/", passport.authenticate("jwt", { session: false }), async (req, res) => {
    try {
        const { title, description, date } = req.body;
        const createdBy = req.user.id;

        if (!title || !date) {
            return res.status(412).json({ error: "Заполните обязательные поля: title, date" });
        }

        const parsedDate = new Date(date);
        if (isNaN(parsedDate.getTime())) {
            return res.status(400).json({ error: "Некорректный формат даты" });
        }

        const event = await Event.create({ title, description, date: parsedDate, createdBy });
        res.status(201).json(event);
    } catch (error) {
        res.status(500).json({ error: "Ошибка при создании мероприятия", details: error.message });
    }
});

/**
 * @swagger
 * /events/{id}:
 *   put:
 *     security:
 *       - bearerAuth: []
 *     summary: Обновить мероприятие
 *     description: Вносит изменения в существующее мероприятие по его ID.
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: Уникальный идентификатор мероприятия
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EventUpdate'
 *     responses:
 *       200:
 *         description: Мероприятие обновлено
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Event'
 *       400:
 *         description: Ошибка в данных
 *       403:
 *         description: Нет прав для изменения
 *       404:
 *         description: Мероприятие не найдено
 *       500:
 *         description: Внутренняя ошибка сервера
 */
router.put("/:id", passport.authenticate("jwt", { session: false }), async (req, res) => {
    try {
        const event = await Event.findByPk(req.params.id);
        if (!event) {
            return res.status(404).json({ error: "Мероприятие не найдено" });
        }

        if (req.user.id !== event.createdBy) {
            return res.status(403).json({ error: "Нет прав для изменения" });
        }

        const { date } = req.body;
        if (date) {
            const parsedDate = new Date(date);
            if (isNaN(parsedDate.getTime())) {
                return res.status(400).json({ error: "Некорректный формат даты" });
            }
            req.body.date = parsedDate;
        }

        await event.update(req.body);
        res.status(200).json(event);
    } catch (error) {
        res.status(500).json({ error: "Ошибка при обновлении мероприятия", details: error.message });
    }
});

/**
 * @swagger
 * /events/{id}:
 *   delete:
 *     security:
 *       - bearerAuth: []
 *     summary: Удалить мероприятие
 *     description: Удаляет мероприятие из системы по его ID.
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: Уникальный идентификатор мероприятия
 *     responses:
 *       200:
 *         description: Мероприятие успешно удалено
 *       403:
 *         description: Нет прав для удаления
 *       404:
 *         description: Мероприятие не найдено
 *       500:
 *         description: Ошибка сервера
 */
router.delete("/:id", passport.authenticate("jwt", { session: false }), async (req, res) => {
    try {
        const event = await Event.findByPk(req.params.id);
        if (!event) {
            return res.status(404).json({ error: "Мероприятие не найдено" });
        }

        if (req.user.id !== event.createdBy) {
            return res.status(403).json({ error: "Нет прав для удаления" });
        }

        await event.destroy();
        res.status(200).json({ message: "Мероприятие удалено" });
    } catch (error) {
        res.status(500).json({ error: "Ошибка при удалении мероприятия", details: error.message });
    }
});

module.exports = router;