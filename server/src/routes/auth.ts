import express from 'express';
import passport from 'passport';
import User from '../models/user';
import { UserAttributes, UserInstance } from '../types/auth';

const router = express.Router();

router.post('/register', async (req, res, next) => {
    try {
      const { email, password } = req.body;
  
      // Validate input
      if (!email || !password) {
        res.status(400).json({
          message: 'Email and password are required',
        });
        return;
      }
  
      // Check if user already exists
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        res.status(400).json({
          message: 'Email is already registered',
        });
        return;
      }
  
      // Validate password strength
      if (password.length < 8) {
        res.status(400).json({
          message: 'Password must be at least 8 characters long',
        });
        return;
      }
  
      // Create new user
      const user = await User.create({
        id: 0,
        email,
        password, // Password will be hashed by the beforeCreate hook
      });
  
      // Don't send password back
      const { password: _, ...userWithoutPassword } = user.get();
  
      res.status(201).json({
        message: 'Registration successful',
        user: userWithoutPassword,
      });
    } catch (error) {
      next(error);
    }
  });
  
  // Update the status endpoint to include user info
  router.get('/status', (req, res) => {
    if (req.isAuthenticated() && req.user) {
        // Safe to type assert since we've checked isAuthenticated
        const user = req.user as UserAttributes;
        res.json({
          isAuthenticated: true,
          user: {
            id: user.id,
            email: user.email,
          },
        });
      } else {
        res.json({
          isAuthenticated: false,
          user: null,
        });
      }
  });

router.post('/login', (req, res, next) => {
  passport.authenticate('local', (err: Error, user: UserInstance, info: any) => {
    if (err) return next(err);
    if (!user) {
      return res.status(401).json({ message: info.message });
    }
    req.logIn(user, (err) => {
      if (err) return next(err);
      return res.json({ message: 'Login successful' });
    });
  })(req, res, next);
});

router.post('/logout', (req, res) => {
  req.logout(() => {
    res.json({ message: 'Logout successful' });
  });
});

export default router;