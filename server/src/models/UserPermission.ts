import { Model, DataTypes } from "sequelize";
import sequelize from "../config/database";
import { UserPermissionAttributes } from "../types/auth";

class UserPermission extends Model<UserPermissionAttributes, UserPermissionAttributes> {
  declare id: number;
  declare userId: number;
  declare permissions: string;
}

UserPermission.init(
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
      },
      onDelete: "CASCADE"
    },
    permissions: {
      type: DataTypes.TEXT,
      allowNull: false
    }
  },
  {
    sequelize,
    modelName: "UserPermission",
    tableName: "UserPermissions",
    indexes: [
      {
        unique: true,
        fields: ["userId"],
        name: "user_unique"
      }
    ]
  }
);

export default UserPermission;
