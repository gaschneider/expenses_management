import { Request, Response, NextFunction } from "express";
import { UserInstance } from "../types/auth";
import passport from "passport";
import { validateEmail } from "../helpers/emailHelper";
import User from "../models/Users";

export const registerAction = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    // Validate input
    if (!email || !password) {
      res.status(400).json({
        error: "Email and password are required"
      });
      return;
    }

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      res.status(400).json({
        error: "Email is already registered"
      });
      return;
    }

    // Validate password strength
    if (password.length < 8) {
      res.status(400).json({
        error: "Password must be at least 8 characters long"
      });
      return;
    }

    if (!validateEmail(email)) {
      res.status(400).json({
        error: "Invalid email"
      });
      return;
    }

    // Create new user
    const user = await User.create({
      firstName,
      lastName,
      email,
      password // Password will be hashed by the beforeCreate hook
    });

    // Don't send password back
    const { password: _, ...userWithoutPassword } = user.get();

    res.status(201).json({
      message: "Registration successful",
      user: userWithoutPassword
    });
  } catch (error) {
    next(error);
  }
};

export const statusAction = (req: Request, res: Response) => {
  if (req.isAuthenticated() && req.user) {
    // Safe to type assert since we've checked isAuthenticated
    const user = req.user;
    res.json({
      isAuthenticated: true,
      user
    });
  } else {
    res.json({
      isAuthenticated: false
    });
  }
};

export const loginAction = (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate("local", (err: Error, user: UserInstance, info: any) => {
    if (err) return next(err);
    if (!user) {
      return res.status(401).json({ message: info.message });
    }
    req.logIn(user, (err) => {
      if (err) return next(err);
      return res.json({
        message: "Login successful",
        user
      });
    });
  })(req, res, next);
};

export const logoutAction = (req: Request, res: Response) => {
  req.logout(() => {
    res.json({ message: "Logout successful" });
  });
};
