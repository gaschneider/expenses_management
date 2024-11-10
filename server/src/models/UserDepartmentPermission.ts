import { Model, DataTypes } from "sequelize";
import sequelize from "../config/database";
import { UserDepartmentPermissionAttributes } from "../types/auth";
import User from "./User";
import Department from "./Department";

class UserDepartmentPermission extends Model<
  UserDepartmentPermissionAttributes,
  UserDepartmentPermissionAttributes
> {
  declare id: number;
  declare userId: number;
  declare departmentId: number;
  declare permissions: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  // Declare relationship properties
  declare user?: User;
  declare department?: Department;

  // Declare association methods
  declare getUser: () => Promise<User>;
  declare setUser: (user: User) => Promise<void>;
  declare getDepartment: () => Promise<Department>;
  declare setDepartment: (department: Department) => Promise<void>;

  // Helper methods for permissions
  public getPermissionArray(): string[] {
    return this.permissions.split(",");
  }

  public hasPermission(permission: string): boolean {
    return this.getPermissionArray().includes(permission);
  }

  public addPermission(permission: string): void {
    const permissions = new Set(this.getPermissionArray());
    permissions.add(permission);
    this.permissions = Array.from(permissions).join(",");
  }

  public removePermission(permission: string): void {
    const permissions = new Set(this.getPermissionArray());
    permissions.delete(permission);
    this.permissions = Array.from(permissions).join(",");
  }

  public setPermissions(permissions: string[]): void {
    this.permissions = Array.from(new Set(permissions)).join(",");
  }

  // Static helper methods
  public static async findByUserAndDepartment(
    userId: number,
    departmentId: number
  ): Promise<UserDepartmentPermission | null> {
    return UserDepartmentPermission.findOne({
      where: {
        userId,
        departmentId
      },
      include: [
        {
          model: User,
          as: "user"
        },
        {
          model: Department,
          as: "department"
        }
      ]
    });
  }

  public static async findAllByUser(userId: number): Promise<UserDepartmentPermission[]> {
    return UserDepartmentPermission.findAll({
      where: { userId },
      include: [
        {
          model: Department,
          as: "department"
        }
      ]
    });
  }

  public static async findAllByDepartment(
    departmentId: number
  ): Promise<UserDepartmentPermission[]> {
    return UserDepartmentPermission.findAll({
      where: { departmentId },
      include: [
        {
          model: User,
          as: "user"
        }
      ]
    });
  }
}

UserDepartmentPermission.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "Users",
        key: "id"
      }
    },
    departmentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "Departments",
        key: "id"
      }
    },
    permissions: {
      type: DataTypes.TEXT,
      allowNull: false
    }
  },
  {
    sequelize,
    modelName: "UserDepartmentPermission",
    tableName: "UserDepartmentPermissions"
  }
);

export default UserDepartmentPermission;
