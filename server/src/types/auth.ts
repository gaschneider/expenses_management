import { Model } from "sequelize";

// Interface for User model attributes
export interface UserAttributes {
  id?: number;
  email: string;
  password: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Interface for User instance
export interface UserInstance extends Model<UserAttributes>, UserAttributes {
  validatePassword(password: string): Promise<boolean>;
}

// Extend Express Request type to include our User type
declare global {
  namespace Express {
    interface User extends UserAttributes {
      id?: number;
      email: string;
    }
  }
}
