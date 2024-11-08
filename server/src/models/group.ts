import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database";
import { GroupAttributes, GroupInstance, PermissionAttributes, UserInstance } from "../types/auth";

class Group extends Model<GroupAttributes> implements GroupInstance {
  declare id?: number;
  declare name: string;
  declare description: string;

  // Update to match interface
  declare permissions?: PermissionAttributes[];
  declare users?: UserInstance[];

  // Update method names to be plural
  declare getPermissions: () => Promise<PermissionAttributes[]>;
  declare setPermissions: (permissions: PermissionAttributes[]) => Promise<void>;
  declare addPermission: (permission: PermissionAttributes) => Promise<void>;
  declare removePermission: (permission: PermissionAttributes) => Promise<void>;

  // Add user-related methods
  declare getUsers: () => Promise<UserInstance[]>;
  declare setUsers: (users: UserInstance[]) => Promise<void>;
  declare addUser: (user: UserInstance) => Promise<void>;
  declare removeUser: (user: UserInstance) => Promise<void>;
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
    tableName: "Groups",
    modelName: "Group"
  }
);

export default Group;
