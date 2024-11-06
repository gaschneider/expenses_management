import { Sequelize } from "sequelize";
import config, { Env } from "../config/config";

const environment = (process.env.NODE_ENV || "development") as Env;
const dbConfig = config[environment];

export const createDatabaseIfNeeded = async () => {
  // Create a connection to MySQL without specifying a database
  let sequelize = new Sequelize(
    `mysql://${dbConfig.username}:${dbConfig.password}@${dbConfig.host}:3306`,
    {
      dialect: "mysql"
    }
  );

  try {
    await sequelize.query(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database}`);
    console.log("Database created or already exists.");
  } catch (error) {
    console.error("Error creating database:", error);
    sequelize.close();
    return false;
  }

  return true;
};
