import { Model, DataTypes } from "sequelize";
import sequelize from "../config/database";
import { PermissionAttributes } from "../types/auth";

class Permission extends Model<PermissionAttributes> implements PermissionAttributes {
  declare id?: number;
  declare name: string;
  declare description: string;
}

Permission.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true
    }
  },
  {
    sequelize,
    tableName: "Permissions",
    modelName: "Permission"
  }
);

export default Permission;
