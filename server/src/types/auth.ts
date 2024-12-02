import { Model } from "sequelize";
import Department from "../models/Department";
import UserDepartmentPermission from "../models/UserDepartmentPermission";
import User from "../models/User";

// Interface for User model attributes
export interface UserAttributes {
  id?: number;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Interface for Department model attributes
export interface DepartmenAttributes {
  id?: number;
  name: string;
  description: string;
  createdAt?: Date;
  updatedAt?: Date;
  users?: User[];
  userDepartmentPermission?: UserDepartmentPermission[];
}

// Interface for User Department Permissions model attributes
export interface UserDepartmentPermissionAttributes {
  id?: number;
  userId: number;
  departmentId: number;
  permissions: string;
  createdAt?: Date;
  updatedAt?: Date;
  user?: User;
  department?: Department;
}

// Interface for User Permissions model attributes
export interface UserPermissionAttributes {
  id?: number;
  userId: number;
  permissions: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Interface for Permission Audit Log model attributes
export interface PermissionAuditLogAttributes {
  id?: number;
  targetUserId: number; // User whose permissions were changed
  performedByUserId: number; // User who made the change
  action: AuditAction;
  entityType: string; // 'UserPermission' or 'UserDepartmentPermission'
  entityId: number;
  departmentId?: number;
  oldPermissions?: string;
  newPermissions: string;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserInstance extends Model<UserAttributes>, UserAttributes {
  validatePassword(password: string): Promise<boolean>;
}

export enum DepartmentPermission {
  VIEW_EXPENSES = "VIEW_EXPENSES",
  CREATE_EXPENSES = "CREATE_EXPENSES",
  APPROVE_EXPENSES = "APPROVE_EXPENSES",
  REJECT_EXPENSES = "REJECT_EXPENSES",
  CREATE_WORKFLOW_RULES = "CREATE_WORKFLOW_RULES",
  EDIT_WORKFLOW_RULES = "EDIT_WORKFLOW_RULES",
  DELETE_WORKFLOW_RULES = "DELETE_WORKFLOW_RULES"
}

export enum SystemPermission {
  CREATE_DEPARTMENT = "CREATE_DEPARTMENT",
  EDIT_DEPARTMENT = "EDIT_DEPARTMENT",
  DELETE_DEPARTMENT = "DELETE_DEPARTMENT",
  MANAGE_USER_SYSTEM_PERMISSIONS = "MANAGE_USER_SYSTEM_PERMISSIONS",
  MANAGE_USER_DEPARTMENT_PERMISSIONS = "MANAGE_USER_DEPARTMENT_PERMISSIONS",
  MANAGE_RULES = "MANAGE_RULES",
  ADMIN = "ADMIN"
}

export enum AuditAction {
  GRANT = "GRANT",
  REVOKE = "REVOKE",
  MODIFY = "MODIFY"
}

// Extend Express Request type to include our User type
declare global {
  namespace Express {
    interface User extends Omit<UserAttributes, "password"> {
      id?: number;
      firstName: string;
      lastName: string;
      email: string;
      userPermission?: {
        permissions: string;
      };
      departments?: {
        id: number;
        name: string;
        description: string;
        userDepartmentPermission: {
          permissions: string;
        };
      }[];
    }
  }
}
