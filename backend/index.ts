import express from "express";
import cors from "cors";
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import morgan from "morgan";
import dotenv from "dotenv";
import path from "path";
import { authenticateDB, sequelize } from "@config/db";
import userRoutes from "@routes/users";
import eventRoutes from "@routes/events";
import authRoutes from "@routes/auth";
import passport from "@config/passport";
import "module-alias/register";
import "tsconfig-paths/register";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS?.split(",") || [];
const allowedMethods = process.env.CORS_ALLOWED_METHODS?.split(",") || [];
const allowedHeaders = process.env.CORS_ALLOWED_HEADERS?.split(",") || [];

app.use(morgan(":method :url"));

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: allowedMethods,
  allowedHeaders: allowedHeaders,
};

app.use(cors(corsOptions));
app.use(express.json());

const swaggerOptions: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Event Management API",
      version: "1.0.0",
      description: "API для управления мероприятиями и пользователями",
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: "Development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
  },
  apis: [path.join(__dirname, "routes/*.ts"), path.join(__dirname, "models/*.ts")],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use(passport.initialize());

app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/events", eventRoutes);

authenticateDB();

sequelize
  .sync({ force: true })
  .then(() => {
    console.log("База данных синхронизирована");
  })
  .catch((error: Error) => {
    console.error("Ошибка синхронизации базы данных:", error.message);
  });

app.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
});
