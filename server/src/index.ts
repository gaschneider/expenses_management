import express from 'express';
const app = express();
import cors from 'cors';
import { addExpense, getAllExpenses } from './controllers/expenseController';

app.use(cors())

export const server = app.listen(8081, async () => {
    console.log('server listening on port 8081');
});

app.post('/', async (req, res) => {
    const newExpense = await addExpense();
    res.send(newExpense);
})

app.get('/expenses', async (req, res) => {
    const expenses = await getAllExpenses();
    res.send(expenses);
})

export default app;