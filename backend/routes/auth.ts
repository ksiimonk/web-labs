import express, { Request, Response } from "express";
import User from "../models/User";
import jwt from "jsonwebtoken";
import { sendSecurityAlert } from "../utils/emailSender";
import { body, validationResult, ValidationError } from "express-validator";
import logger from "../utils/logger";
import "express-async-errors";
import passport from "passport";
/* eslint-disable @typescript-eslint/no-namespace */

// Интерфейсы запросов
interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

interface LoginRequest {
  email: string;
  password: string;
}

interface AuthResponse {
  token: string;
  securityAlert: boolean;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface ErrorResponse {
  error: string;
  details?: string;
}

// Расширение типа Express User
declare global {
  namespace Express {
    interface User {
      id: string;
      email: string;
      name: string;
      comparePassword(password: string): Promise<boolean>;
      ipHistory: string[];
      deviceHistory: string[];
      notificationPreferences: {
        newDeviceAlert: boolean;
      };
    }
  }
}

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Аутентификация пользователей
 *
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *         email:
 *           type: string
 *           format: email
 *         createdAt:
 *           type: string
 *           format: date-time
 *     AuthResponse:
 *       type: object
 *       properties:
 *         token:
 *           type: string
 *         user:
 *           $ref: '#/components/schemas/User'
 *         securityAlert:
 *           type: boolean
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *         details:
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
 *     summary: Регистрация нового пользователя
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       201:
 *         description: Пользователь успешно зарегистрирован
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   format: uuid
 *                 email:
 *                   type: string
 *       400:
 *         description: Ошибка валидации
 *       409:
 *         description: Email уже существует
 *       500:
 *         description: Внутренняя ошибка сервера
 */
router.post(
  "/register",
  [
    body("name").trim().isLength({ min: 2 }),
    body("email").isEmail().normalizeEmail(),
    body("password").isLength({ min: 8 }),
  ],
  async (
    req: Request<object, object, RegisterRequest>,
    res: Response<{ id: string; email: string } | { errors: ValidationError[] } | ErrorResponse>,
  ): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn("Validation errors during registration", {
        errors: errors.array() as ValidationError[],
      });
      res.status(400).json({ errors: errors.array() });
      return;
    }

    try {
      const { name, email, password } = req.body;
      logger.debug(`Registration attempt for email: ${email}`);

      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        logger.warn(`Duplicate registration attempt for email: ${email}`);
        res.status(409).json({ error: "Email уже используется" });
        return;
      }

      const user = await User.create({ name, email, password });
      logger.info(`User registered successfully: ${email}`, { userId: user.id });

      res.status(201).json({
        id: user.id,
        email: user.email,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logger.error("Registration failed", { error: message });
      res.status(500).json({
        error: "Ошибка регистрации",
        ...(process.env.NODE_ENV === "development" && { details: message }),
      });
    }
  },
);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Аутентификация пользователя
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Успешный вход
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Ошибка валидации
 *       401:
 *         description: Неверные учетные данные
 *       404:
 *         description: Пользователь не найден
 *       500:
 *         description: Внутренняя ошибка сервера
 */
router.post(
  "/login",
  [body("email").isEmail().normalizeEmail(), body("password").exists()],
  async (
    req: Request<object, object, LoginRequest>,
    res: Response<AuthResponse | { errors: ValidationError[] } | ErrorResponse>,
  ): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn("Login validation errors", { errors: errors.array() as ValidationError[] });
      res.status(400).json({ errors: errors.array() });
      return;
    }

    try {
      const { email, password } = req.body;
      logger.debug(`Login attempt for email: ${email}`);

      const user = await User.scope("withPassword").findOne({ where: { email } });

      if (!user) {
        logger.warn(`Login attempt for non-existent user: ${email}`);
        res.status(404).json({ error: "Пользователь не найден" });
        return;
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        logger.warn(`Invalid password attempt for user: ${email}`);
        res.status(401).json({ error: "Неверный пароль" });
        return;
      }

      const clientIp =
        req.ip || (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || "";
      const userAgent = req.headers["user-agent"] || "unknown";
      const deviceHash = User.hashDevice(userAgent);

      const isNewIp = !user.ipHistory.includes(clientIp);
      const isNewDevice = !user.deviceHistory.includes(deviceHash);
      let securityAlert = false;

      if ((isNewIp || isNewDevice) && user.notificationPreferences?.newDeviceAlert) {
        try {
          await sendSecurityAlert({
            email: user.email,
            ip: clientIp,
            device: userAgent,
            date: new Date().toLocaleString(),
          });
          securityAlert = true;
          logger.info(`Security alert sent to ${user.email}`, {
            ip: clientIp,
            device: userAgent,
            isNewIp,
            isNewDevice,
          });
        } catch (emailError) {
          logger.error("Failed to send security alert", {
            error: emailError instanceof Error ? emailError.message : "Unknown error",
            userId: user.id,
          });
        }
      }

      await user.update({
        ipHistory: [...new Set([clientIp, ...user.ipHistory.slice(0, 4)])],
        deviceHistory: [...new Set([deviceHash, ...user.deviceHistory.slice(0, 4)])],
        lastLoginIp: clientIp,
      });

      if (!process.env.JWT_SECRET) {
        const errorMsg = "JWT_SECRET is not configured";
        logger.error(errorMsg);
        throw new Error(errorMsg);
      }

      const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: "1h" });
      logger.info(`User logged in successfully: ${email}`, { userId: user.id });

      res.json({
        token,
        securityAlert,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logger.error("Login failed", { error: message });
      res.status(500).json({
        error: "Ошибка входа",
        ...(process.env.NODE_ENV === "development" && { details: message }),
      });
    }
  },
);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Получить данные текущего пользователя
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Данные пользователя
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Не авторизован
 *       500:
 *         description: Ошибка сервера
 */
router.get(
  "/me",
  passport.authenticate("jwt", { session: false }),
  async (req: Request, res: Response<User | ErrorResponse>) => {
    try {
      if (!req.user) {
        res.status(401).json({ error: "Не авторизован" });
        return;
      }

      // Возвращаем данные пользователя без пароля
      const user = await User.findByPk(req.user.id, {
        attributes: { exclude: ["password"] },
      });

      if (!user) {
        res.status(404).json({ error: "Пользователь не найден" });
        return;
      }

      res.json(user);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({
        error: "Ошибка загрузки данных пользователя",
        details: message,
      });
    }
  },
);

export default router;
