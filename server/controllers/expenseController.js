import { Expense } from '../database.js';

export const addExpense = async () => {
  const expense = await Expense.create({
      description: 'Lunch',
      amount: 15.50,
      date: new Date(),
  });
  return expense.dataValues;
};

export const getAllExpenses = async () => {  
  try {
      const expenses = await Expense.findAll();
      console.log('All Expenses:', JSON.stringify(expenses, null, 2));
      return expenses;
  } catch (error) {
      console.error('Error fetching expenses:', error);
  }
}