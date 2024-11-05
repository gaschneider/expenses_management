import express from 'express';
const app = express();
import cors from 'cors';
import { addExpense, getAllExpenses } from './controllers/expenseController';
import { sequelize } from './models';
import { createDatabaseIfNeeded } from './scripts/createDb';
import authRoutes from './routes/auth';
import session from 'express-session';
import passport from 'passport';
import './config/passport';

const initDatabase = async () => {
  try {
    await createDatabaseIfNeeded();
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
    
    // Sync all models
    // Note: force: true will drop tables if they exist
    // Use force: false in production!
    await sequelize.sync({ force: false });
    console.log('Database synchronized successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    process.exit(1);
  }
};

export const startServer = async () => {
    app.use(cors({
        origin: 'http://localhost:3000', // or your frontend URL
        credentials: true // Important for authentication
    }));
    
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    
    app.use(session({
        secret: 'your-secret-key',
        resave: false,
        saveUninitialized: false,
        cookie: { 
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
        }
    }));
    
    app.use(passport.initialize());
    app.use(passport.session());
    
    await initDatabase();
    
    // Mount routes
    app.use('/api/auth', authRoutes);
    
    // Your other routes
    app.post('/', async (req, res) => {
        const newExpense = await addExpense();
        res.send(newExpense);
    });
    
    app.get('/expenses', async (req, res) => {
        const expenses = await getAllExpenses();
        res.send(expenses);
    });
    
    const server = app.listen(8081, () => {
        console.log('Server listening on port 8081');
    });
    
    return server;
}

if(process.env.NODE_ENV != "test"){
    startServer();
}

export default app;