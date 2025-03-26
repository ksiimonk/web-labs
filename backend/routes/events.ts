import express from "express";
import { Op } from "sequelize";
import Event from "@models/Event";
import passport from "passport";

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

router.get("/", async (req: express.Request, res: express.Response) => {
  try {
    const { startDate, endDate } = req.query;
    const filter: { date?: { [Op.gte]?: Date; [Op.lte]?: Date } } = {};

    if (startDate) {
      const parsedStartDate = new Date(startDate as string);
      if (isNaN(parsedStartDate.getTime())) {
        res.status(400).json({ error: "Некорректный формат начальной даты" });
        return;
      }
      filter.date = { [Op.gte]: parsedStartDate };
    }

    if (endDate) {
      const parsedEndDate = new Date(endDate as string);
      if (isNaN(parsedEndDate.getTime())) {
        res.status(400).json({ error: "Некорректный формат конечной даты" });
        return;
      }
      filter.date = { ...filter.date, [Op.lte]: parsedEndDate };
    }

    const events = await Event.findAll({ where: filter });
    res.json(events);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({
      error: "Ошибка при получении мероприятий",
      details: message,
    });
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

router.get("/:id", async (req: express.Request, res: express.Response) => {
  try {
    const event = await Event.findByPk(req.params.id);
    if (!event) {
      res.status(404).json({ error: "Мероприятие не найдено" });
      return;
    }
    res.json(event);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({
      error: "Ошибка при поиске мероприятия",
      details: message,
    });
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

router.post(
  "/",
  passport.authenticate("jwt", { session: false }),
  async (req: express.Request, res: express.Response) => {
    try {
      const { title, description, date } = req.body;
      const createdBy = (req.user as { id: string }).id;

      if (!title || !date) {
        res.status(400).json({ error: "Заполните обязательные поля: title, date" });
        return;
      }

      const parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) {
        res.status(400).json({ error: "Некорректный формат даты" });
        return;
      }

      const event = await Event.create({
        title,
        description,
        date: parsedDate,
        createdBy,
      });

      res.status(201).json(event);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({
        error: "Ошибка при создании мероприятия",
        details: message,
      });
    }
  },
);

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

router.put(
  "/:id",
  passport.authenticate("jwt", { session: false }),
  async (req: express.Request, res: express.Response) => {
    try {
      const event = await Event.findByPk(req.params.id);
      if (!event) {
        res.status(404).json({ error: "Мероприятие не найдено" });
        return;
      }

      if ((req.user as { id: string }).id !== event.createdBy) {
        res.status(403).json({ error: "Недостаточно прав для изменения" });
        return;
      }

      const { date, ...rest } = req.body;
      const updateData: { date?: Date; [key: string]: any } = { ...rest };

      if (date) {
        const parsedDate = new Date(date);
        if (isNaN(parsedDate.getTime())) {
          res.status(400).json({ error: "Некорректный формат даты" });
          return;
        }
        updateData.date = parsedDate;
      }

      await event.update(updateData);
      res.json(event);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({
        error: "Ошибка при обновлении мероприятия",
        details: message,
      });
    }
  },
);

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

router.delete(
  "/:id",
  passport.authenticate("jwt", { session: false }),
  async (req: express.Request, res: express.Response) => {
    try {
      const event = await Event.findByPk(req.params.id);
      if (!event) {
        res.status(404).json({ error: "Мероприятие не найдено" });
        return;
      }

      if ((req.user as { id: string }).id !== event.createdBy) {
        res.status(403).json({ error: "Недостаточно прав для удаления" });
        return;
      }

      await event.destroy();
      res.status(204).send();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({
        error: "Ошибка при удалении мероприятия",
        details: message,
      });
    }
  },
);

export default router;
