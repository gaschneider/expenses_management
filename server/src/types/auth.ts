import { Model } from "sequelize";

// Interface for User model attributes
export interface UserAttributes {
  id?: number;
  email: string;
  password: string;
  createdAt?: Date;
  updatedAt?: Date;
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
}

export interface UserInstance extends Model<UserAttributes>, UserAttributes {
  validatePassword(password: string): Promise<boolean>;

  // Use lowercase to match association aliases
  groups?: GroupInstance[];
  getGroups: () => Promise<GroupInstance[]>;
  setGroups: (groups: GroupInstance[]) => Promise<void>;
  addGroup: (group: GroupInstance) => Promise<void>;
  removeGroup: (group: GroupInstance) => Promise<void>;
}

export interface GroupInstance extends Model<GroupAttributes>, GroupAttributes {
  permissions?: PermissionAttributes[];
  users?: UserInstance[];

  getPermissions: () => Promise<PermissionAttributes[]>;
  setPermissions: (permissions: PermissionAttributes[]) => Promise<void>;
  addPermission: (permission: PermissionAttributes) => Promise<void>;
  removePermission: (permission: PermissionAttributes) => Promise<void>;

  getUsers: () => Promise<UserInstance[]>;
  setUsers: (users: UserInstance[]) => Promise<void>;
  addUser: (user: UserInstance) => Promise<void>;
  removeUser: (user: UserInstance) => Promise<void>;
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
      groups?: GroupInstance[];
    }
  }
}
