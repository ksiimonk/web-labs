import express from "express";
import User from "../models/User";
import jwt from "jsonwebtoken";
import { sendSecurityAlert } from "../utils/emailSender";
import { body, validationResult } from "express-validator";
import logger from "../utils/logger"; // Импорт вашего логгера

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: User authentication endpoints
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
 *     summary: Register a new user
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
 *         description: User registered successfully
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
 *         description: Validation error
 *       409:
 *         description: Email already exists
 *       500:
 *         description: Internal server error
 */
router.post(
  "/register",
  [
    body("name").trim().isLength({ min: 2 }),
    body("email").isEmail().normalizeEmail(),
    body("password").isLength({ min: 8 }),
  ],
  async (req: express.Request, res: express.Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn("Validation errors during registration", { errors: errors.array() });
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { name, email, password } = req.body;
      logger.debug(`Registration attempt for email: ${email}`);

      const existingUser = await User.findOne({ where: { email } });
      
      if (existingUser) {
        logger.warn(`Duplicate registration attempt for email: ${email}`);
        return res.status(409).json({ error: "Email already in use" });
      }

      const user = await User.create({ name, email, password });
      logger.info(`User registered successfully: ${email}`, { userId: user.id });
      
      return res.status(201).json({ 
        id: user.id, 
        email: user.email 
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logger.error("Registration failed", { error: message });
      return res.status(500).json({ 
        error: "Registration failed",
        ...(process.env.NODE_ENV === "development" && { details: message })
      });
    }
  }
);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Authenticate user
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
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Invalid credentials
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.post(
  "/login",
  [body("email").isEmail().normalizeEmail(), body("password").exists()],
  async (req: express.Request, res: express.Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn("Login validation errors", { errors: errors.array() });
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { email, password } = req.body;
      logger.debug(`Login attempt for email: ${email}`);

      const user = await User.scope("withPassword").findOne({ where: { email } });

      if (!user) {
        logger.warn(`Login attempt for non-existent user: ${email}`);
        return res.status(404).json({ error: "User not found" });
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        logger.warn(`Invalid password attempt for user: ${email}`);
        return res.status(401).json({ error: "Invalid password" });
      }

      const clientIp = req.ip || (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || "";
      const userAgent = req.headers['user-agent'] || "unknown";
      const deviceHash = User.hashDevice(userAgent);

      // Check for new device/login
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
            isNewDevice
          });
        } catch (emailError) {
          logger.error("Failed to send security alert", { 
            error: emailError instanceof Error ? emailError.message : "Unknown error",
            userId: user.id
          });
        }
      }

      // Update login history
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

      return res.json({
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
      return res.status(500).json({ 
        error: "Login failed",
        ...(process.env.NODE_ENV === "development" && { details: message })
      });
    }
  }
);

export default router;