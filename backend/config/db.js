const { Sequelize } = require("sequelize");
require("dotenv").config();

// Создаём объект Sequelize с параметрами подключения
const sequelize = new Sequelize(
    process.env.DB_NAME,     // Название БД
    process.env.DB_USER,     // Пользователь
    process.env.DB_PASSWORD, // Пароль
    {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        dialect: "postgres", // Указываем, что используем PostgreSQL
        logging: false,      // Отключаем логи SQL-запросов
    }
);

// Функция проверки соединения
const authenticateDB = async () => {
    try {
        await sequelize.authenticate();
        console.log("Успешное подключение к базе данных");
    } catch (error) {
        console.error("Ошибка подключения к базе данных:", error);
    }
};

// Экспортируем объект для использования в моделях
module.exports = { sequelize, authenticateDB };
