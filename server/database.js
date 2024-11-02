import { Sequelize } from 'sequelize';
import ExpenseModel from './models/expense.js';
import config from "./config/config.js";

const environment = process.env.NODE_ENV || 'development';
const dbConfig = config[environment];
// console.log(dbConfig);

const sequelize = new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, {
    host: dbConfig.host,
    dialect: 'mysql',
});

sequelize.authenticate();

export const Expense = ExpenseModel(sequelize);

export default sequelize;