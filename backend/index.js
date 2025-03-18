const express = require("express");
const cors = require("cors");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const morgan = require("morgan");
require("dotenv").config();
const { authenticateDB, sequelize } = require("./config/db");
const userRoutes = require("./routes/users");
const eventRoutes = require("./routes/events");
const authRoutes = require("./routes/auth");
const passport = require("passport");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS.split(',');
const allowedMethods = process.env.CORS_ALLOWED_METHODS.split(',');
const allowedHeaders = process.env.CORS_ALLOWED_HEADERS.split(',');

app.use(morgan(':method :url'));

const corsOptions = {
  origin: (origin, callback) => {
    if (allowedOrigins.includes(origin) || !origin) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  methods: allowedMethods,
  allowedHeaders: allowedHeaders,
};

app.use(cors(corsOptions));

app.use((req, res, next) => {
  if (!req.headers.origin || allowedOrigins.includes(req.headers.origin)) {
    return next();
  }
  res.status(403).json({ message: "Access Forbidden: CORS policy does not allow this origin." });
});

app.use(express.json());

// Swagger
const swaggerOptions = {
    swaggerDefinition: {
      openapi: "3.0.0",
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
    apis: ["./routes/*.js"],
  };
  
const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Passport
app.use(passport.initialize());
require("./config/passport");

// Роутеры
app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/events", eventRoutes);

// Проверка БД
authenticateDB();

sequelize.sync({ force: false }).then(() => {
    console.log("База данных синхронизирована");
}).catch((error) => {
    console.error("Ошибка синхронизации базы данных:", error);
});

app.listen(PORT, (err) => {
    if (err) {
        console.error("Ошибка при запуске сервера:", err);
        process.exit(1);
    }
    console.log(`Сервер запущен на http://localhost:${PORT}`);
});