require("dotenv").config({ path: require("path").resolve(__dirname, "..", "..", ".env") });
require("dotenv").config();

const common = {
  dialect: "mysql",
  host: process.env.DB_HOST || "localhost",
  password: process.env.DB_PASSWORD || "change-me",
  port: Number(process.env.DB_PORT || 3306),
  username: process.env.DB_USER || "daily_pulse",
};

module.exports = {
  development: { ...common, database: process.env.DB_NAME || "daily_pulse" },
  production: { ...common, database: process.env.DB_NAME || "daily_pulse" },
  test: { ...common, database: `${process.env.DB_NAME || "daily_pulse"}_test` },
};
