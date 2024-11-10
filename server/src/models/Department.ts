import { Model, DataTypes, Transaction } from "sequelize";
import sequelize from "../config/database";
import { DepartmenAttributes } from "../types/auth";
import UserDepartmentPermission from "./UserDepartmentPermission";
import User from "./User";
import Expense from "./Expense";

class Department extends Model<DepartmenAttributes, DepartmenAttributes> {
  declare id?: number;
  declare name: string;
  declare description: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  // Declare relationship properties
  declare users?: User[];
  declare userDepartmentPermission?: UserDepartmentPermission;
  declare expenses?: Expense[];

  // Declare association methods
  declare getUsers: () => Promise<User[]>;
  declare setUsers: (users: User[]) => Promise<void>;
  declare addUser: (user: User) => Promise<void>;
  declare removeUser: (user: User) => Promise<void>;
  declare getUserDepartmentPermissions: () => Promise<UserDepartmentPermission[]>;

  declare getExpenses: () => Promise<Expense[]>;
  declare setExpenses: (permissions: Expense[]) => Promise<void>;
  declare addExpense: (permission: Expense) => Promise<void>;
  declare removeExpense: (permission: Expense) => Promise<void>;

  // User Permission Methods
  public async addUserPermissionString(
    userId: number,
    permission: string,
    transaction?: Transaction
  ): Promise<void> {
    const existingPermissions = await this.getUserPermissionStrings(userId);
    const permissions = new Set(existingPermissions);
    permissions.add(permission);

    await UserDepartmentPermission.upsert(
      {
        departmentId: this.id!,
        userId,
        permissions: Array.from(permissions).join(",")
      },
      { transaction }
    );
  }

  public async removeUserPermissionString(
    userId: number,
    permission: string,
    transaction?: Transaction
  ): Promise<void> {
    const existingPermissions = await this.getUserPermissionStrings(userId);
    const permissions = new Set(existingPermissions);
    permissions.delete(permission);

    if (permissions.size === 0) {
      await UserDepartmentPermission.destroy({
        where: {
          departmentId: this.id!,
          userId
        },
        transaction
      });
    } else {
      await UserDepartmentPermission.update(
        { permissions: Array.from(permissions).join(",") },
        {
          where: {
            departmentId: this.id!,
            userId
          },
          transaction
        }
      );
    }
  }

  public async setUserPermissionStrings(
    userId: number,
    permissions: string[],
    transaction?: Transaction
  ): Promise<void> {
    const permissionString = permissions.join(",");
    await UserDepartmentPermission.upsert(
      {
        departmentId: this.id!,
        userId,
        permissions: permissionString
      },
      { transaction }
    );
  }

  public async getUserPermissionStrings(userId: number): Promise<string[]> {
    const userPermission = await UserDepartmentPermission.findOne({
      where: {
        departmentId: this.id!,
        userId
      }
    });
    return userPermission ? userPermission.permissions.split(",") : [];
  }

  public async hasUserPermissionString(userId: number, permission: string): Promise<boolean> {
    const permissions = await this.getUserPermissionStrings(userId);
    return permissions.includes(permission);
  }

  // Department Users Methods
  public async getUsersWithPermission(permission: string): Promise<User[]> {
    const userDepartmentPermissions = await UserDepartmentPermission.findAll({
      where: {
        departmentId: this.id!
      },
      include: [
        {
          model: User,
          as: "user"
        }
      ]
    });

    return userDepartmentPermissions
      .filter((udp) => udp.permissions.split(",").includes(permission))
      .map((udp) => udp.user!);
  }

  public async getAllUsersWithPermissions(): Promise<Array<{ user: User; permissions: string[] }>> {
    const userDepartmentPermissions = await UserDepartmentPermission.findAll({
      where: {
        departmentId: this.id!
      },
      include: [
        {
          model: User,
          as: "user"
        }
      ]
    });

    return userDepartmentPermissions.map((udp) => ({
      user: udp.user!,
      permissions: udp.permissions.split(",")
    }));
  }
}

Department.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true
    }
  },
  {
    sequelize,
    modelName: "Department",
    tableName: "Departments"
  }
);

export default Department;
