import { Model } from "sequelize";
import Group from "../models/group";

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
  Groups?: Group[];
  getGroups: () => Promise<Group[]>;
  setGroups: (groups: Group[]) => Promise<void>;
  addGroup: (group: Group) => Promise<void>;
  removeGroup: (group: Group) => Promise<void>;
}

export interface PermissionAttributes {
  id?: number;
  name: string;
  description: string;
}

export interface GroupAttributes {
  id?: number;
  name: string;
  description: string;
  Permissions?: PermissionAttributes[];
}

export interface GroupInstance extends Model<GroupAttributes>, GroupAttributes {
  Permissions?: PermissionAttributes[];

  getPermission: () => Promise<PermissionAttributes[]>;
  setPermission: (groups: PermissionAttributes[]) => Promise<void>;
  addPermission: (group: PermissionAttributes) => Promise<void>;
  removePermission: (group: PermissionAttributes) => Promise<void>;
}

export interface GroupPermissionAttributes {
  groupId: number;
  permissionId: number;
}

export interface UserGroupAttributes {
  userId: number;
  groupId: number;
}

// Extend Express Request type to include our User type
declare global {
  namespace Express {
    interface User extends UserAttributes {
      id?: number;
      email: string;
      Groups?: Group[];
    }
  }
}
