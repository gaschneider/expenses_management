import { Sequelize } from 'sequelize';
import ExpenseModel from './models/expense.js';

// Create a connection to MySQL without specifying a database
export const sequelize = new Sequelize('mysql://root:148623@localhost:3306', {
    dialect: 'mysql',
});

// Function to create the database if it doesn't exist
const createDatabase = async () => {
    try {
        await sequelize.query("CREATE DATABASE IF NOT EXISTS expenses_management");
        console.log('Database created or already exists.');
    } catch (error) {
        console.error('Error creating database:', error);
    }
};

export const authenticateDB = async () => {
    // Call the function to create the database
    await createDatabase();
    
    // Now connect to the specific database
    const sequelizeWithDB = new Sequelize('expenses_management', 'root', '148623', {
        host: 'localhost',
        dialect: 'mysql',
    });

    // Test connection
    try {
        await sequelizeWithDB.authenticate();

        const Expense = ExpenseModel(sequelizeWithDB);

        await sequelizeWithDB.sync();
        console.log('Connection to the database has been established successfully.');

        return { sequelize: sequelizeWithDB, Expense };
    } catch (error) {
        console.error('Unable to connect to the database:', error);
        return null;
    }
}