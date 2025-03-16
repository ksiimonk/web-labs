const express = require("express");
const cors = require("cors");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const morgan = require("morgan");
require("dotenv").config();
const { authenticateDB, sequelize } = require("./config/db");
const userRoutes = require("./routes/users");
const eventRoutes = require("./routes/events");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 5000; // Порт для сервера

const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS.split(',');
const allowedMethods = process.env.CORS_ALLOWED_METHODS.split(',');
const allowedHeaders = process.env.CORS_ALLOWED_HEADERS.split(',');

app.use(morgan(':method :url'));

const corsOptions = {
  origin: (origin, callback) => {
    if (allowedOrigins.includes(origin) || !origin) {
      callback(null, true);
    } else {
      callback(null, false); // Отклоняем запрос без ошибки, но без CORS-заголовков
    }
  },
  methods: allowedMethods,
  allowedHeaders: allowedHeaders,
};

// Используем CORS с кастомной обработкой ошибок
app.use(cors(corsOptions));

// Middleware для возврата ошибки при блокировке CORS
app.use((req, res, next) => {
  if (!req.headers.origin || allowedOrigins.includes(req.headers.origin)) {
    return next();
  }
  res.status(403).json({ message: "Access Forbidden: CORS policy does not allow this origin." });
});

app.use(express.json()); // Для парсинга JSON данных

// Swagger Documentation Configuration
const swaggerOptions = {
    swaggerDefinition: {
      openapi: "3.0.0", // Определение версии OpenAPI
      info: {
        title: "API для управления мероприятиями",
        description: "Документация API для работы с пользователями и мероприятиями",
        version: "1.0.0",
      },
      servers: [
        {
          url: `http://localhost:${PORT}`,
        },
      ],
    },
    apis: ["./routes/*.js"], // Путь к файлам с API-маршрутами
  };
  
  // Инициализация Swagger JSDoc
  const swaggerSpec = swaggerJsdoc(swaggerOptions);
  
  // Подключение маршрута для отображения документации Swagger
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Подключаем маршруты
app.use("/users", userRoutes);
app.use("/events", eventRoutes);

// Проверяем соединение с базой данных
authenticateDB();

// Синхронизация базы данных
sequelize.sync({ force: false }).then(() => {
    console.log("База данных синхронизирована");
}).catch((error) => {
    console.error("Ошибка синхронизации базы данных:", error);
});

// Запуск сервера
app.listen(PORT, (err) => {
    if (err) {
        console.error("Ошибка при запуске сервера:", err);
        process.exit(1);
    }
    console.log(`Сервер запущен на http://localhost:${PORT}`);
});
