import { Model, DataTypes } from "sequelize";
import sequelize from "../config/database";
import { CurrencyEnum, ExpenseAttributes, ExpenseStatusEnum } from "../types/expense";
import User from "./User";
import Department from "./Department";
import ExpenseStatus from "./ExpenseStatus";
import { Category } from "./Category";

class Expense extends Model<ExpenseAttributes, ExpenseAttributes> {
  declare id: number;
  declare categoryId: number;
  declare amount: number;
  declare date: Date;
  declare departmentId: number;
  declare title: string;
  declare justification: string;
  declare requesterId: number;
  declare projectId: number | null;
  declare costCenter: string;
  declare currency: CurrencyEnum;
  declare paymentDate: Date | null;
  declare currentStatus: ExpenseStatusEnum;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  // Declare relationship properties
  declare requester?: User;
  declare Category?: Category;
  declare department?: Department;
  declare expenseStatuses?: ExpenseStatus[];

  // Declare association methods
  declare getRequester: () => Promise<User>;
  declare setRequester: (user: User) => Promise<void>;
  declare getDepartment: () => Promise<Department>;
  declare setDepartment: (department: Department) => Promise<void>;
  declare getCategory: () => Promise<Category>;
  declare setCategory: (department: Category) => Promise<void>;

  declare getExpenseStatuses: () => Promise<ExpenseStatus[]>;
  declare setExpenseStatuses: (users: ExpenseStatus[]) => Promise<void>;
  declare addExpenseStatus: (user: ExpenseStatus) => Promise<void>;
  declare removeExpenseStatus: (user: ExpenseStatus) => Promise<void>;
}

Expense.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    categoryId: {
      type: DataTypes.INTEGER,
      references: {
        model: "Categories",
        key: "id"
      },
      allowNull: false,
      comment: "Expense category (e.g., travel, food)"
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      comment: "Expense amount"
    },
    date: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: "Expense date"
    },
    departmentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "Departments",
        key: "id"
      },
      comment: "Requesting department"
    },
    title: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: "Expense title"
    },
    justification: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: "Expense justification"
    },
    requesterId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "Users",
        key: "id"
      },
      comment: "ID of the requesting employee"
    },
    projectId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      //   references: {
      //     model: "Projects",
      //     key: "id"
      //   },
      comment: "Associated project ID"
    },
    costCenter: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: "Cost center (e.g., marketing, technology)"
    },
    currency: {
      type: DataTypes.ENUM(...Object.values(CurrencyEnum)),
      allowNull: false,
      defaultValue: CurrencyEnum.BRL,
      comment: "Expense currency"
    },
    paymentDate: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: "Expense payment date"
    },
    currentStatus: {
      type: DataTypes.ENUM(...Object.values(ExpenseStatusEnum)),
      allowNull: false,
      defaultValue: ExpenseStatusEnum.DRAFT,
      comment: "Current status of the expense"
    }
  },
  {
    sequelize,
    modelName: "Expense",
    tableName: "Expenses"
  }
);

export default Expense;
