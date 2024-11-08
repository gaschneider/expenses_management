import { Model, DataTypes } from "sequelize";
import sequelize from "../config/database";
import { UserGroupAttributes } from "../types/auth";

class UserGroup extends Model<UserGroupAttributes> implements UserGroupAttributes {
  declare userId: number;
  declare groupId: number;
}

UserGroup.init(
  {
    userId: {
      type: DataTypes.INTEGER,
      primaryKey: true
    },
    groupId: {
      type: DataTypes.INTEGER,
      primaryKey: true
    }
  },
  {
    sequelize,
    tableName: "UserGroups",
    timestamps: false
  }
);

export default UserGroup;
