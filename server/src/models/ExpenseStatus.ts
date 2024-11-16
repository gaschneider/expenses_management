import { Model, DataTypes } from "sequelize";
import sequelize from "../config/database";
import { ExpenseStatusAttributes, ExpenseStatusEnum } from "../types/expense";
import User from "./User";

class ExpenseStatus extends Model<ExpenseStatusAttributes, ExpenseStatusAttributes> {
  declare id: number;
  declare expenseId: number;
  declare status: ExpenseStatusEnum;
  declare userId: number;
  declare comment: string | null;
  declare attachments?: string | null;
  declare nextApproverId: number | null;
  declare dueDate: Date | null;
  declare readonly createdAt?: Date;
  declare readonly updatedAt?: Date;

  // Declare relationship properties
  declare user?: User;
  declare nextApprover?: User;

  // Declare association methods
  declare getUser: () => Promise<User>;
  declare setUser: (user: User) => Promise<void>;
  declare getNextApprover: () => Promise<User>;
  declare setNextApprover: (user: User) => Promise<void>;
}

ExpenseStatus.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    expenseId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "Expenses",
        key: "id"
      },
      comment: "Reference to the expense"
    },
    status: {
      type: DataTypes.ENUM(...Object.values(ExpenseStatusEnum)),
      allowNull: false,
      comment: "Status of the expense at this step"
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "Users",
        key: "id"
      },
      comment: "User who made the status change"
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Optional comment for the status change"
    },
    nextApproverId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "Users",
        key: "id"
      },
      comment: "Next user in the approval flow"
    },
    dueDate: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: "Due date for the current status (if applicable)"
    }
  },
  {
    sequelize,
    modelName: "ExpenseStatus",
    tableName: "ExpenseStatuses"
  }
);

export default ExpenseStatus;