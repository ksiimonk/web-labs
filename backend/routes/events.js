const express = require("express");
const { Op } = require("sequelize");
const Event = require("../models/Event");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Events
 *   description: API для управления мероприятиями
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

//  Получить список всех мероприятий
router.get("/", async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        // Строим условие фильтрации
        let filter = {};

        if (startDate) {
            const parsedStartDate = new Date(startDate);
            if (isNaN(parsedStartDate.getTime())) {
                return res.status(400).json({ error: "Некорректный формат начальной даты" });
            }
            filter.date = { [Op.gte]: parsedStartDate }; // Условие "больше или равно"
        }

        if (endDate) {
            const parsedEndDate = new Date(endDate);
            if (isNaN(parsedEndDate.getTime())) {
                return res.status(400).json({ error: "Некорректный формат конечной даты" });
            }
            filter.date = {
                ...filter.date,
                [Op.lte]: parsedEndDate, // Условие "меньше или равно"
            };
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

//  Получить одно мероприятие по ID
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
 *     summary: Создать новое мероприятие
 *     description: Создает новое мероприятие в системе.
 *     tags: [Events]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - date
 *             properties:
 *               title:
 *                 type: string
 *                 description: Название мероприятия
 *               description:
 *                 type: string
 *                 description: Описание мероприятия
 *               date:
 *                 type: string
 *                 format: date
 *                 description: Дата проведения мероприятия
 *     responses:
 *       201:
 *         description: Мероприятие успешно создано
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   format: uuid
 *                 title:
 *                   type: string
 *                 description:
 *                   type: string
 *                 date:
 *                   type: string
 *                   format: date
 *       400:
 *         description: Некорректные данные
 *       500:
 *         description: Внутренняя ошибка сервера
 */

//  Создать мероприятие (POST /events)
router.post("/", async (req, res) => {
    try {
        const { title, description, date, createdBy } = req.body;

        // Проверяем обязательные поля
        if (!title || !date || !createdBy) {
            return res.status(412).json({ error: "Заполните обязательные поля: title, date, createdBy" });
        }

        // Проверяем корректность даты
        const parsedDate = new Date(date);
        if (isNaN(parsedDate.getTime())) {
            return res.status(400).json({ error: "Некорректный формат даты" });
        }

        // Создаем мероприятие
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
 *       404:
 *         description: Мероприятие не найдено
 *       500:
 *         description: Внутренняя ошибка сервера
 */

//  Обновить мероприятие (PUT /events/:id)
router.put("/:id", async (req, res) => {
    try {
        const event = await Event.findByPk(req.params.id);
        if (!event) {
            return res.status(404).json({ error: "Мероприятие не найдено" });
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
 *       404:
 *         description: Мероприятие не найдено
 *       500:
 *         description: Ошибка сервера
 */

//  Удалить мероприятие (DELETE /events/:id)
router.delete("/:id", async (req, res) => {
    try {
        const event = await Event.findByPk(req.params.id);
        if (!event) {
            return res.status(404).json({ error: "Мероприятие не найдено" });
        }

        await event.destroy();
        res.status(200).json({ message: "Мероприятие удалено" });
    } catch (error) {
        res.status(500).json({ error: "Ошибка при удалении мероприятия", details: error.message });
    }
});

module.exports = router;