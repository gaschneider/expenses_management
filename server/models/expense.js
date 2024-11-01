import { DataTypes } from 'sequelize';

const ExpenseModel = (sequelize) => {
    return sequelize.define('Expense', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        description: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        amount: {
            type: DataTypes.FLOAT,
            allowNull: false,
        },
        date: {
            type: DataTypes.DATE,
            allowNull: false,
        },
    });
};

export default ExpenseModel;