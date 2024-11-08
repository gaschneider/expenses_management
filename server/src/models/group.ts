import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";
import { GroupAttributes, GroupInstance, PermissionAttributes } from "../types/auth";

class Group extends Model<GroupAttributes> implements GroupInstance {
  declare id?: number;
  declare name: string;
  declare description: string;

  // Declare associations
  declare Permissions?: PermissionAttributes[];

  declare getPermission: () => Promise<PermissionAttributes[]>;
  declare setPermission: (groups: PermissionAttributes[]) => Promise<void>;
  declare addPermission: (group: PermissionAttributes) => Promise<void>;
  declare removePermission: (group: PermissionAttributes) => Promise<void>;
}

Group.init(
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
    tableName: "groups"
  }
);

export default Group;
