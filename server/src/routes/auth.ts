import express from 'express';
import { loginAction, logoutAction, registerAction, statusAction } from '../controllers/authController';

const router = express.Router();

router.post('/register', registerAction);
  
router.get('/status', statusAction);

router.post('/login', loginAction);

router.post('/logout', logoutAction);

export default router;