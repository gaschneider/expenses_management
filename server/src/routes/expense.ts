// // routes/expenseRoutes.ts
// import { Router } from 'express';
// import { checkPermission } from '../middlewares/checkPermission';
// import { body, validationResult } from 'express-validator';
// import Expense from '../models/expense';

// const router = Router();

// // Validation middleware
// const validateExpense = [
//   body('amount').isNumeric().withMessage('Amount must be a number'),
//   body('description').notEmpty().withMessage('Description is required'),
//   body('category').notEmpty().withMessage('Category is required'),
// ];

// // Routes
// router.post('/expenses',
//   validateExpense,
//   async (req, res) => {
//     try {
//       const errors = validationResult(req);
//       if (!errors.isEmpty()) {
//         return res.status(400).json({ errors: errors.array() });
//       }

//       // Create expense logic here
//       const expense = await Expense.create({
//         ...req.body,
//         userId: req.user!.id,
//         status: 'pending'
//       });

//       res.status(201).json(expense);
//     } catch (error) {
//       console.error('Create expense error:', error);
//       res.status(500).json({ error: 'Internal server error' });
//     }
// });

// router.get('/expenses',
//   async (req, res) => {
//     try {
//       const expenses = await Expense.findAll({
//         where: { userId: req.user!.id },
//       });
//       res.json(expenses);
//     } catch (error) {
//       console.error('Get expenses error:', error);
//       res.status(500).json({ error: 'Internal server error' });
//     }
// });

// // Protected route - only accessible by finance team
// router.post('/expenses/:id/approve',
//   checkPermission('finance'), // Middleware to check for finance permission
//   async (req, res) => {
//     try {
//       const expense = await Expense.findByPk(req.params.id);

//       if (!expense) {
//         return res.status(404).json({ error: 'Expense not found' });
//       }

//       if (expense.status !== 'pending') {
//         return res.status(400).json({ error: 'Expense is not in pending status' });
//       }

//       await expense.update({ status: 'approved' });
//       res.json(expense);
//     } catch (error) {
//       console.error('Approve expense error:', error);
//       res.status(500).json({ error: 'Internal server error' });
//     }
// });

// router.post('/expenses/:id/reject',
//   checkPermission('finance'),
//   async (req, res) => {
//     try {
//       const expense = await Expense.findByPk(req.params.id);

//       if (!expense) {
//         return res.status(404).json({ error: 'Expense not found' });
//       }

//       if (expense.status !== 'pending') {
//         return res.status(400).json({ error: 'Expense is not in pending status' });
//       }

//       await expense.update({
//         status: 'rejected',
//         rejectionReason: req.body.reason
//       });
//       res.json(expense);
//     } catch (error) {
//       console.error('Reject expense error:', error);
//       res.status(500).json({ error: 'Internal server error' });
//     }
// });

// export default router;
