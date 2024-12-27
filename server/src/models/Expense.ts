import { Model, DataTypes } from "sequelize";
import sequelize from "../config/database";
import {
  CurrencyEnum,
  ExpenseAttributes,
  ExpenseStatusEnum,
  NextApproverType
} from "../types/expense";
import User from "./User";
import Department from "./Department";
import ExpenseStatus from "./ExpenseStatus";
import { Category } from "./Category";
import { Rule } from "./Rule";

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
  declare costCenter: string | null;
  declare currency: CurrencyEnum;
  declare paymentDate: Date | null;
  declare currentStatus: ExpenseStatusEnum;
  declare ruleId: number | null;
  declare currentRuleStep: number | null;
  declare nextApproverType: NextApproverType | null;
  declare nextApproverId: number | null;

  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  // Declare relationship properties
  declare requester?: User;
  declare category?: Category;
  declare department?: Department;
  declare rule?: Rule;
  declare expenseStatuses?: ExpenseStatus[];

  // Declare association methods
  declare getRequester: () => Promise<User>;
  declare setRequester: (user: User) => Promise<void>;
  declare getDepartment: () => Promise<Department>;
  declare setDepartment: (department: Department) => Promise<void>;
  declare getCategory: () => Promise<Category>;
  declare setCategory: (category: Category) => Promise<void>;
  declare getRule: () => Promise<Rule>;
  declare setRule: (rule: Rule) => Promise<void>;

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
      allowNull: true,
      comment: "Cost center (e.g., marketing, technology)"
    },
    currency: {
      type: DataTypes.ENUM(...Object.values(CurrencyEnum)),
      allowNull: false,
      defaultValue: CurrencyEnum.CAD,
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
    },
    currentRuleStep: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    nextApproverType: {
      type: DataTypes.ENUM(...Object.values(NextApproverType)),
      allowNull: true
    },
    nextApproverId: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    ruleId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "Rules",
        key: "id"
      }
    }
  },
  {
    sequelize,
    modelName: "Expense",
    tableName: "Expenses"
  }
);

export default Expense;
