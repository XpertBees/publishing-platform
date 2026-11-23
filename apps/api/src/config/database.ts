import "dotenv/config";
import { Sequelize } from "sequelize";

/**
 * Single Sequelize instance for the API. Connection settings come from
 * DB_HOST / DB_PORT / DB_NAME / DB_USER / DB_PASSWORD (see .env.example).
 * Pool sizing is deliberately small — raise for production behind a
 * connection pooler or with more replicas.
 */
export const sequelize = new Sequelize(
  process.env.DB_NAME ?? "daily_pulse",
  process.env.DB_USER ?? "daily_pulse",
  process.env.DB_PASSWORD ?? "change-me",
  {
    dialect: "mysql",
    host: process.env.DB_HOST ?? "localhost",
    logging: process.env.NODE_ENV === "development" ? console.log : false,
    pool: { acquire: 30000, idle: 10000, max: 10, min: 0 },
    port: Number(process.env.DB_PORT ?? 3306),
  },
);

export default sequelize;
