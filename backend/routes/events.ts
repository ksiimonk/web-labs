import express from "express";
import { Op } from "sequelize";
import Event from "@models/Event";
import passport from "passport";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Events
 *   description: Управление мероприятиями
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
 *           readOnly: true
 *           description: Уникальный идентификатор
 *         title:
 *           type: string
 *           description: Название мероприятия
 *         description:
 *           type: string
 *           nullable: true
 *           description: Описание
 *         date:
 *           type: string
 *           format: date-time
 *           readOnly: true
 *           description: Дата создания (устанавливается автоматически)
 *         createdBy:
 *           type: string
 *           format: uuid
 *           readOnly: true
 *           description: ID создателя
 *       required:
 *         - title
 *         - date
 *         - createdBy
 *
 *     EventCreate:
 *       type: object
 *       properties:
 *         title:
 *           type: string
 *           description: Название мероприятия
 *         description:
 *           type: string
 *           nullable: true
 *           description: Описание
 *       required:
 *         - title
 *
 *     EventUpdate:
 *       type: object
 *       properties:
 *         title:
 *           type: string
 *           description: Новое название
 *         description:
 *           type: string
 *           nullable: true
 *           description: Новое описание
 */

/**
 * @swagger
 * /events:
 *   get:
 *     summary: Получить все мероприятия
 *     tags: [Events]
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Начальная дата фильтрации
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Конечная дата фильтрации
 *     responses:
 *       200:
 *         description: Список мероприятий
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Event'
 *       500:
 *         description: Ошибка сервера
 */
router.get("/", async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const where: any = {};

    if (startDate) {
      const date = new Date(startDate as string);
      if (isNaN(date.getTime())) {
        return res.status(400).json({ error: "Неверный формат даты" });
      }
      where.date = { [Op.gte]: date };
    }

    if (endDate) {
      const date = new Date(endDate as string);
      if (isNaN(date.getTime())) {
        return res.status(400).json({ error: "Неверный формат даты" });
      }
      where.date = { ...where.date, [Op.lte]: date };
    }

    const events = await Event.findAll({ where });
    res.json(events);
  } catch (error) {
    res.status(500).json({
      error: "Ошибка при получении мероприятий",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * @swagger
 * /events:
 *   post:
 *     summary: Создать мероприятие
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EventCreate'
 *     responses:
 *       201:
 *         description: Мероприятие создано
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Event'
 *       400:
 *         description: Неверные данные
 *       500:
 *         description: Ошибка сервера
 */
router.post("/", passport.authenticate("jwt", { session: false }), async (req, res) => {
  try {
    const { title, description } = req.body;

    if (!title) {
      return res.status(400).json({ error: "Название обязательно" });
    }

    const event = await Event.create({
      title,
      description: description || null,
      date: new Date(),
      createdBy: (req.user as { id: string }).id,
    });

    return res.status(201).json(event);
  } catch (error) {
    return res.status(500).json({
      error: "Ошибка создания мероприятия",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * @swagger
 * /events/{id}:
 *   get:
 *     summary: Получить мероприятие по ID
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *     responses:
 *       200:
 *         description: Данные мероприятия
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
    res.json(event);
  } catch (error) {
    res.status(500).json({
      error: "Ошибка при получении мероприятия",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * @swagger
 * /events/{id}:
 *   put:
 *     summary: Обновить мероприятие
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
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
 *         description: Неверные данные
 *       403:
 *         description: Нет прав на изменение
 *       404:
 *         description: Мероприятие не найдено
 *       500:
 *         description: Ошибка сервера
 */
router.put("/:id", passport.authenticate("jwt", { session: false }), async (req, res) => {
  try {
    const event = await Event.findByPk(req.params.id);
    if (!event) {
      return res.status(404).json({ error: "Мероприятие не найдено" });
    }

    if ((req.user as { id: string }).id !== event.createdBy) {
      return res.status(403).json({ error: "Нет прав на изменение" });
    }

    const { title, description } = req.body;
    const updateData: { title?: string; description?: string | null } = {};

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: "Нет данных для обновления" });
    }

    await event.update(updateData);
    return res.json(event);
  } catch (error) {
    return res.status(500).json({
      error: "Ошибка обновления мероприятия",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * @swagger
 * /events/{id}:
 *   delete:
 *     summary: Удалить мероприятие
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *     responses:
 *       204:
 *         description: Мероприятие удалено
 *       403:
 *         description: Нет прав на удаление
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

    if ((req.user as { id: string }).id !== event.createdBy) {
      return res.status(403).json({ error: "Нет прав на удаление" });
    }

    await event.destroy();
    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({
      error: "Ошибка удаления мероприятия",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default router;
