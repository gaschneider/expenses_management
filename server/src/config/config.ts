import dotenv from "dotenv";
import path from "path";

export type Env = "test" | "development" | "production";

// Load the appropriate .env file
const envFilePath = path.resolve(process.cwd(), `.env.${process.env.NODE_ENV || "development"}`);
dotenv.config({ path: envFilePath });

const config = {
  development: {
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    logging: process.env.DB_LOGGING ? process.env.DB_LOGGING.toLowerCase() === "true" : false
  },
  test: {
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    logging: process.env.DB_LOGGING ? process.env.DB_LOGGING.toLowerCase() === "true" : false
  },
  demo: {
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    logging: process.env.DB_LOGGING ? process.env.DB_LOGGING.toLowerCase() === "true" : false
  },
  production: {
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    logging: process.env.DB_LOGGING ? process.env.DB_LOGGING.toLowerCase() === "true" : false
  }
};

export default config;
