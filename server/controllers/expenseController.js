import { db } from "../index.js"

export const addExpense = async () => {
  if(!db) return;

  const expense = await db.Expense.create({
      description: 'Lunch',
      amount: 15.50,
      date: new Date(),
  });
  return expense.dataValues;
};

export const getAllExpenses = async () => {
  if(!db) return;
  
  try {
      const expenses = await db.Expense.findAll();
      console.log('All Expenses:', JSON.stringify(expenses, null, 2));
      return expenses;
  } catch (error) {
      console.error('Error fetching expenses:', error);
  }
}