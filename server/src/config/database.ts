import { Sequelize } from "sequelize";
import config, { Env } from "./config";

const environment = (process.env.NODE_ENV || "development") as Env;
const dbConfig = config[environment];
// console.log(dbConfig);

const sequelize = new Sequelize(
  dbConfig.database ?? "",
  dbConfig.username ?? "",
  dbConfig.password,
  {
    host: dbConfig.host,
    dialect: "mysql",
    logging: dbConfig.logging
  }
);

export default sequelize;
