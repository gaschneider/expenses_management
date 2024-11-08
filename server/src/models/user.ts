import { Model, DataTypes } from "sequelize";
import bcrypt from "bcryptjs";
import sequelize from "../config/database";
import { GroupInstance, UserAttributes, UserInstance } from "../types/auth";

class User extends Model<UserAttributes, UserAttributes> implements UserInstance {
  declare id?: number;
  declare email: string;
  declare password: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  public async validatePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
  }

  // Declare associations
  declare Groups?: GroupInstance[];

  declare getGroups: () => Promise<GroupInstance[]>;
  declare setGroups: (groups: GroupInstance[]) => Promise<void>;
  declare addGroup: (group: GroupInstance) => Promise<void>;
  declare removeGroup: (group: GroupInstance) => Promise<void>;
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
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
    modelName: "User",
    hooks: {
      beforeCreate: async (user) => {
        user.password = await bcrypt.hash(user.password, 10);
      }
    }
  }
);

export default User;
