import { Model, DataTypes } from "sequelize";
import sequelize from "../config/database";
import { GroupPermissionAttributes } from "../types/auth";

class GroupPermission
  extends Model<GroupPermissionAttributes>
  implements GroupPermissionAttributes
{
  declare groupId: number;
  declare permissionId: number;
}

GroupPermission.init(
  {
    groupId: {
      type: DataTypes.INTEGER,
      primaryKey: true
    },
    permissionId: {
      type: DataTypes.INTEGER,
      primaryKey: true
    }
  },
  {
    sequelize,
    tableName: "GroupPermissions",
    timestamps: false
  }
);

export default GroupPermission;
