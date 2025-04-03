import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME!,
  process.env.DB_USER!,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || "5432"),
    dialect: "postgres",
  },
);

const authenticateDB = async () => {
  try {
    await sequelize.authenticate();
    console.log("Успешное подключение к базе данных");
  } catch (error) {
    console.error("Ошибка подключения к базе данных:", error);
  }
};

export { sequelize, authenticateDB };
