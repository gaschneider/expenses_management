import { authenticateDB } from './database.js';
import express from 'express';
const app = express();
import cors from 'cors';
import { addExpense, getAllExpenses } from './controllers/expenseController.js';

export let sequelizeWithDB = null;
export let db = null;

app.use(cors())

app.listen(8081, async () => {
    console.log('server listening on port 8081');
    const result = await authenticateDB();
    if(result){
        sequelizeWithDB = result.sequelize;
        db = {
            Expense: result.Expense
        }
    }
});

app.get('/', async (req, res) => {
    const newExpense = await addExpense();
    res.send(newExpense);
})

app.get('/expenses', async (req, res) => {
    const expenses = await getAllExpenses();
    res.send(expenses);
})

