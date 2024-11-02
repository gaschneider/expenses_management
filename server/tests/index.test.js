import request from 'supertest';
import app, {server} from '../index.js';
import sequelize from '../database.js';

describe('Expenses', () => {
    it('should insert expense', async () => {
        const response = await request(app).post('/');
        expect(response.status).toBe(200);
        expect(response.body.description).toBe("Lunch");
    });

    it('should check expense exist', async () => {
        const response = await request(app).get('/expenses');
        expect(response.status).toBe(200);
        const expenses = response.body;
        const [firstExpense] = expenses;
        expect(firstExpense.description).toBe("Lunch");
    });
});

afterAll(async () => {
  await sequelize.drop();
  await sequelize.close(); // Close connection after tests
  server.close()
});