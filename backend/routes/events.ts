import express, { Request, Response } from "express";
import { Op } from "sequelize";
import Event from "@models/Event";
import passport from "passport";
import "express-async-errors";
import User from "@models/User";
/* eslint-disable @typescript-eslint/no-namespace */

interface EventCreateRequest {
  title: string;
  description?: string;
  date?: string;
}

interface EventUpdateRequest {
  title?: string;
  description?: string | null;
  date?: string;
}

interface DateFilterQuery {
  startDate?: string;
  endDate?: string;
}

interface ErrorResponse {
  error: string;
  details?: string;
}

declare global {
  namespace Express {
    interface User {
      id: string;
    }
  }
}

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Events
 *   description: Управление событиями
 *
 * components:
 *   schemas:
 *     Event:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           readOnly: true
 *         title:
 *           type: string
 *         description:
 *           type: string
 *           nullable: true
 *         date:
 *           type: string
 *           format: date-time
 *         createdBy:
 *           type: string
 *           format: uuid
 *           readOnly: true
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
 *         description:
 *           type: string
 *           nullable: true
 *         date:
 *           type: string
 *           format: date-time
 *           description: Дата проведения события (по умолчанию текущая дата)
 *       required:
 *         - title
 *
 *     EventUpdate:
 *       type: object
 *       properties:
 *         title:
 *           type: string
 *         description:
 *           type: string
 *           nullable: true
 *         date:
 *           type: string
 *           format: date-time
 *           description: Новая дата проведения события
 */

/**
 * @swagger
 * /events:
 *   get:
 *     summary: Получить все события
 *     tags: [Events]
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Список событий
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Event'
 *       400:
 *         description: Неверный формат даты
 *       500:
 *         description: Ошибка сервера
 */
router.get(
  "/",
  async (
    req: Request<object, object, object, DateFilterQuery>,
    res: Response<Event[] | ErrorResponse>,
  ): Promise<void> => {
    try {
      const { startDate, endDate } = req.query;
      const where: {
        date?: {
          [Op.gte]?: Date;
          [Op.lte]?: Date;
        };
      } = {};

      if (startDate) {
        const date = new Date(startDate);
        if (isNaN(date.getTime())) {
          res.status(400).json({ error: "Неверный формат даты" });
          return;
        }
        where.date = { [Op.gte]: date };
      }

      if (endDate) {
        const date = new Date(endDate);
        if (isNaN(date.getTime())) {
          res.status(400).json({ error: "Неверный формат даты" });
          return;
        }
        where.date = { ...where.date, [Op.lte]: date };
      }

      const events = await Event.findAll({ where });
      res.json(events);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({
        error: "Ошибка получения событий",
        details: message,
      });
    }
  },
);

/**
 * @swagger
 * /events:
 *   post:
 *     summary: Создать событие
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
 *         description: Событие создано
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Event'
 *       400:
 *         description: Неверные данные
 *       401:
 *         description: Не авторизован
 *       500:
 *         description: Ошибка сервера
 */
router.post(
  "/",
  passport.authenticate("jwt", { session: false }),
  async (
    req: Request<object, object, EventCreateRequest>,
    res: Response<Event | ErrorResponse>,
  ): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: "Не авторизован" });
      return;
    }

    try {
      const { title, description, date } = req.body;
      if (!title) {
        res.status(400).json({ error: "Название обязательно" });
        return;
      }

      let eventDate = new Date();
      if (date) {
        const parsedDate = new Date(date);
        if (isNaN(parsedDate.getTime())) {
          res.status(400).json({ error: "Неверный формат даты" });
          return;
        }
        eventDate = parsedDate;
      }

      const event = await Event.create({
        title,
        description: description || null,
        date: eventDate,
        createdBy: req.user.id,
      });

      res.status(201).json(event);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({
        error: "Ошибка создания события",
        details: message,
      });
    }
  },
);

/**
 * @swagger
 * /events/{id}:
 *   get:
 *     summary: Получить событие по ID
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
 *         description: Данные события
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Event'
 *       404:
 *         description: Событие не найдено
 *       500:
 *         description: Ошибка сервера
 */
router.get(
  "/:id",
  async (req: Request<{ id: string }>, res: Response<Event | ErrorResponse>): Promise<void> => {
    try {
      const event = await Event.findByPk(req.params.id);
      if (!event) {
        res.status(404).json({ error: "Событие не найдено" });
        return;
      }
      res.json(event);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({
        error: "Ошибка получения события",
        details: message,
      });
    }
  },
);

/**
 * @swagger
 * /events/{id}:
 *   put:
 *     summary: Обновить событие
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
 *         description: Событие обновлено
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Event'
 *       400:
 *         description: Неверные данные
 *       403:
 *         description: Нет прав на изменение
 *       404:
 *         description: Событие не найдено
 *       500:
 *         description: Ошибка сервера
 */
router.put(
  "/:id",
  passport.authenticate("jwt", { session: false }),
  async (
    req: Request<{ id: string }, object, EventUpdateRequest>,
    res: Response<Event | ErrorResponse>,
  ): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: "Не авторизован" });
      return;
    }

    try {
      const event = await Event.findByPk(req.params.id);
      if (!event) {
        res.status(404).json({ error: "Событие не найдено" });
        return;
      }

      if (req.user.id !== event.createdBy) {
        res.status(403).json({ error: "Нет прав на изменение" });
        return;
      }

      const { title, description, date } = req.body;
      const updateData: { title?: string; description?: string | null; date?: Date } = {};

      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (date !== undefined) {
        const parsedDate = new Date(date);
        if (isNaN(parsedDate.getTime())) {
          res.status(400).json({ error: "Неверный формат даты" });
          return;
        }
        updateData.date = parsedDate;
      }

      if (Object.keys(updateData).length === 0) {
        res.status(400).json({ error: "Нет данных для обновления" });
        return;
      }

      await event.update(updateData);
      res.json(event);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({
        error: "Ошибка обновления события",
        details: message,
      });
    }
  },
);

/**
 * @swagger
 * /events/{id}:
 *   delete:
 *     summary: Удалить событие
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
 *         description: Событие удалено
 *       403:
 *         description: Нет прав на удаление
 *       404:
 *         description: Событие не найдено
 *       500:
 *         description: Ошибка сервера
 */
router.delete(
  "/:id",
  passport.authenticate("jwt", { session: false }),
  async (req: Request<{ id: string }>, res: Response<void | ErrorResponse>): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: "Не авторизован" });
      return;
    }

    try {
      const event = await Event.findByPk(req.params.id);
      if (!event) {
        res.status(404).json({ error: "Событие не найдено" });
        return;
      }

      if (req.user.id !== event.createdBy) {
        res.status(403).json({ error: "Нет прав на удаление" });
        return;
      }

      await event.destroy();
      res.status(204).send();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({
        error: "Ошибка удаления события",
        details: message,
      });
    }
  },
);

/**
 * @swagger
 * /events/{id}/participate:
 *   post:
 *     summary: Записаться на мероприятие
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
 *       200:
 *         description: Успешно записались на мероприятие
 *       400:
 *         description: Нельзя записаться на свое мероприятие
 *       409:
 *         description: Уже записаны на это мероприятие
 *       500:
 *         description: Ошибка сервера
 */
router.post(
  "/:id/participate",
  passport.authenticate("jwt", { session: false }),
  async (req: Request<{ id: string }>, res: Response<Event | ErrorResponse>) => {
    if (!req.user) {
      res.status(401).json({ error: "Не авторизован" });
      return;
    }

    try {
      const event = await Event.findByPk(req.params.id);
      if (!event) {
        res.status(404).json({ error: "Событие не найдено" });
        return;
      }

      // Проверка что пользователь не создатель мероприятия
      if (event.createdBy === req.user.id) {
        res.status(400).json({ error: "Нельзя записаться на свое мероприятие" });
        return;
      }

      // Проверка что пользователь еще не участвует
      if (event.participants.includes(req.user.id)) {
        res.status(409).json({ error: "Вы уже записаны на это мероприятие" });
        return;
      }

      // Добавляем пользователя в участники
      await event.update({
        participants: [...event.participants, req.user.id],
      });

      res.status(200).json(event);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({
        error: "Ошибка записи на мероприятие",
        details: message,
      });
    }
  },
);

/**
 * @swagger
 * /events/{id}/participants:
 *   get:
 *     summary: Получить список участников мероприятия
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
 *         description: Список участников
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       404:
 *         description: Событие не найдено
 *       500:
 *         description: Ошибка сервера
 */

router.get(
  "/:id/participants",
  async (req: Request<{ id: string }>, res: Response<User[] | ErrorResponse>) => {
    try {
      const event = await Event.findByPk(req.params.id);
      if (!event) {
        res.status(404).json({ error: "Событие не найдено" });
        return;
      }

      const users = await User.findAll({
        where: {
          id: {
            [Op.in]: event.participants || [],
          },
        },
        attributes: ["id", "name", "email"],
      });

      res.json(users);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({
        error: "Ошибка получения участников",
        details: message,
      });
    }
  },
);

export default router;
