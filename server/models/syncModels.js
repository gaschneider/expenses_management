import { Sequelize } from 'sequelize';
import config from "../config/config.js";
import ExpenseModel from "./expense.js";

const environment = process.env.NODE_ENV || 'development';
const dbConfig = config[environment];

export const syncModels = async () => {
    // Create a connection to MySQL without specifying a database
    let sequelize = new Sequelize(`mysql://${dbConfig.username}:${dbConfig.password}@${dbConfig.host}:3306`, {
        dialect: 'mysql'
    });

    try{
        await sequelize.query(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database}`);
        console.log('Database created or already exists.');
    }
    catch{
        console.error('Error creating database:', error);
        sequelize.close();
    }

    const sequelizeWithDB = new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, {
        host: dbConfig.host,
        dialect: 'mysql',
    });

    try {
        await sequelizeWithDB.authenticate();
        console.log('Connection to the database has been established successfully.');
        ExpenseModel(sequelizeWithDB);
        await sequelizeWithDB.sync();

        await sequelizeWithDB.close();        
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
}

syncModels();