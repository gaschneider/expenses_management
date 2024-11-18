import { Model, DataTypes, Transaction } from "sequelize";
import bcrypt from "bcryptjs";
import sequelize from "../config/database";
import { UserAttributes, UserInstance } from "../types/auth";
import UserPermission from "./UserPermission";
import UserDepartmentPermission from "./UserDepartmentPermission";
import Department from "./Department";
import Expense from "./Expense";
import ExpenseStatus from "./ExpenseStatus";

class User extends Model<UserAttributes, UserAttributes> implements UserInstance {
  declare id?: number;
  declare firstName: string;
  declare lastName: string;
  declare email: string;
  declare password: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  declare userPermission?: UserPermission;
  declare departments?: Department[];
  declare expenses?: Expense[];

  declare getUserPermissions: () => Promise<UserPermission[]>;
  declare setUserPermissions: (permissions: UserPermission[]) => Promise<void>;
  declare addUserPermission: (permission: UserPermission) => Promise<void>;
  declare removeUserPermission: (permission: UserPermission) => Promise<void>;
  declare getDepartments: () => Promise<Department[]>;
  declare setDepartments: (departments: Department[]) => Promise<void>;
  declare addDepartment: (department: Department) => Promise<void>;
  declare removeDepartment: (department: Department) => Promise<void>;

  declare getExpenses: () => Promise<Expense[]>;
  declare setExpenses: (permissions: Expense[]) => Promise<void>;
  declare addExpense: (permission: Expense) => Promise<void>;
  declare removeExpense: (permission: Expense) => Promise<void>;

  public async validatePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
  }

  // User Permissions Methods
  public async addUserPermissionString(
    permission: string,
    transaction?: Transaction
  ): Promise<void> {
    const existingPermissions = await this.getUserPermissionStrings();
    const permissions = new Set(existingPermissions);
    permissions.add(permission);

    await UserPermission.upsert(
      {
        userId: this.id!,
        permissions: Array.from(permissions).join(",")
      },
      { transaction }
    );
  }

  public async removeUserPermissionString(
    permission: string,
    transaction?: Transaction
  ): Promise<void> {
    const existingPermissions = await this.getUserPermissionStrings();
    const permissions = new Set(existingPermissions);
    permissions.delete(permission);

    if (permissions.size === 0) {
      await UserPermission.destroy({
        where: { userId: this.id! },
        transaction
      });
    } else {
      await UserPermission.update(
        { permissions: Array.from(permissions).join(",") },
        {
          where: { userId: this.id! },
          transaction
        }
      );
    }
  }

  public async setUserPermissionStrings(
    permissions: string[],
    transaction?: Transaction
  ): Promise<void> {
    const permissionString = permissions.join(",");
    await UserPermission.upsert(
      {
        userId: this.id!,
        permissions: permissionString
      },
      { transaction }
    );
  }

  public async getUserPermissionStrings(): Promise<string[]> {
    const userPermission = await UserPermission.findOne({
      where: { userId: this.id! }
    });
    return userPermission && userPermission.permissions
      ? userPermission.permissions.split(",")
      : [];
  }

  public async hasPermissionString(permission: string): Promise<boolean> {
    const permissions = await this.getUserPermissionStrings();
    return permissions.includes(permission);
  }

  // Department Permission Methods
  public async addDepartmentPermissionString(
    departmentId: number,
    permission: string,
    transaction?: Transaction
  ): Promise<void> {
    const existingPermissions = await this.getDepartmentPermissionsStrings(departmentId);
    const permissions = new Set(existingPermissions);
    permissions.add(permission);

    await UserDepartmentPermission.upsert(
      {
        userId: this.id!,
        departmentId,
        permissions: Array.from(permissions).join(",")
      },
      { transaction }
    );
  }

  public async removeDepartmentPermissionStrings(
    departmentId: number,
    permission: string,
    transaction?: Transaction
  ): Promise<void> {
    const existingPermissions = await this.getDepartmentPermissionsStrings(departmentId);
    const permissions = new Set(existingPermissions);
    permissions.delete(permission);

    if (permissions.size === 0) {
      await UserDepartmentPermission.destroy({
        where: {
          userId: this.id!,
          departmentId
        },
        transaction
      });
    } else {
      await UserDepartmentPermission.update(
        { permissions: Array.from(permissions).join(",") },
        {
          where: {
            userId: this.id!,
            departmentId
          },
          transaction
        }
      );
    }
  }

  public async setDepartmentPermissionsStrings(
    departmentId: number,
    permissions: string[],
    transaction?: Transaction
  ): Promise<void> {
    const permissionString = permissions.join(",");
    await UserDepartmentPermission.upsert(
      {
        userId: this.id!,
        departmentId,
        permissions: permissionString
      },
      { transaction }
    );
  }

  public async getDepartmentPermissionsStrings(departmentId: number): Promise<string[]> {
    const departmentPermission = await UserDepartmentPermission.findOne({
      where: {
        userId: this.id!,
        departmentId
      }
    });
    return departmentPermission && departmentPermission.permissions
      ? departmentPermission.permissions.split(",")
      : [];
  }

  public async hasDepartmentPermissionString(
    departmentId: number,
    permission: string
  ): Promise<boolean> {
    const permissions = await this.getDepartmentPermissionsStrings(departmentId);
    return permissions.includes(permission);
  }
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
      validate: {
        isEmail: true
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    }
  },
  {
    sequelize,
    tableName: "Users",
    modelName: "User",
    hooks: {
      beforeCreate: async (user) => {
        user.password = await bcrypt.hash(user.password, 10);
      }
    }
  }
);

export default User;
