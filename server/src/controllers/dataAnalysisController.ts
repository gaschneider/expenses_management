import { Request, Response, NextFunction } from "express";
import Expense from "../models/Expense";
import { ExpenseStatusEnum } from "../types/expense";
import sequelize from "../config/database";
import { Op } from "sequelize";

// Returns the count of expenses grouped by status (merging pending statuses into one).
export const getExpensesStatusCount = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const expensesGrouped = await Expense.findAll({
      attributes: [
        "currentStatus",
        [sequelize.fn("COUNT", sequelize.col("id")), "count"],
      ],
      group: ["currentStatus"],
    });

    const groupedData = {
      DRAFT: 0,
      PENDING: 0,
      APPROVED: 0,
      REJECTED: 0,
    };

    expensesGrouped.forEach((expense) => {
      const status = expense.getDataValue("currentStatus") as string;
      const count = Number(expense.getDataValue("count"));

      switch (status) {
        case ExpenseStatusEnum.DRAFT:
          groupedData.DRAFT += count;
          break;
        case ExpenseStatusEnum.PENDING_APPROVAL:
        case ExpenseStatusEnum.PENDING_ADDITIONAL_INFO:
          groupedData.PENDING += count;
          break;
        case ExpenseStatusEnum.APPROVED:
          groupedData.APPROVED += count;
          break;
        case ExpenseStatusEnum.REJECTED:
          groupedData.REJECTED += count;
          break;
        case ExpenseStatusEnum.CANCELLED:
        default:
          break;
      }
    });

    const responseData = [
      { status: "DRAFT", count: groupedData.DRAFT },
      { status: "PENDING", count: groupedData.PENDING },
      { status: "APPROVED", count: groupedData.APPROVED },
      { status: "REJECTED", count: groupedData.REJECTED },
    ];

    res.status(200).json(responseData);
  } catch (error) {
    next(error);
  }
};

// Returns the total amount of expenses grouped by status (merging pending statuses into one).
export const getExpensesAmountByStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const expensesGrouped = await Expense.findAll({
      attributes: [
        "currentStatus",
        [sequelize.fn("SUM", sequelize.col("amount")), "amount"],
      ],
      group: ["currentStatus"],
    });

    const groupedData = {
      DRAFT: 0,
      PENDING: 0,
      APPROVED: 0,
      REJECTED: 0,
    };

    expensesGrouped.forEach((expense) => {
      const status = expense.getDataValue("currentStatus") as ExpenseStatusEnum;
      const amount = Number(expense.getDataValue("amount"));

      switch (status) {
        case ExpenseStatusEnum.DRAFT:
          groupedData.DRAFT += amount;
          break;
        case ExpenseStatusEnum.PENDING_APPROVAL:
        case ExpenseStatusEnum.PENDING_ADDITIONAL_INFO:
          groupedData.PENDING += amount;
          break;
        case ExpenseStatusEnum.APPROVED:
          groupedData.APPROVED += amount;
          break;
        case ExpenseStatusEnum.REJECTED:
          groupedData.REJECTED += amount;
          break;
        case ExpenseStatusEnum.CANCELLED:
        default:
          break;
      }
    });

    const responseData = Object.entries(groupedData).map(([status, amount]) => ({
      status,
      amount,
    }));

    res.status(200).json(responseData);
  } catch (error) {
    next(error);
  }
};

// Returns the monthly sum of expenses (only with APPROVED status).
export const getExpensesByMonth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const expensesByMonth = await Expense.findAll({
      attributes: [
        [sequelize.fn("MONTHNAME", sequelize.col("date")), "month"],
        [sequelize.fn("SUM", sequelize.col("amount")), "amount"],
      ],
      where: { currentStatus: ExpenseStatusEnum.APPROVED },
      group: [
        sequelize.fn("MONTH", sequelize.col("date")),
        sequelize.fn("MONTHNAME", sequelize.col("date")),
      ],
      order: [[sequelize.fn("MONTH", sequelize.col("date")), "ASC"]],
    });

    const responseData = expensesByMonth.map((expense) => ({
      month: expense.getDataValue("month"),
      amount: Number(expense.getDataValue("amount")),
    }));

    res.status(200).json(responseData);
  } catch (error) {
    next(error);
  }
};

// Returns global metrics (total amount, total expenses, distinct departments, and total pending expenses).
export const getGlobalMetrics = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const [totalAmount, totalExpenses, totalDepartments, pendingExpenses] =
      await Promise.all([
        Expense.sum("amount", {
          where: {
            currentStatus: ExpenseStatusEnum.APPROVED
          }
        }),
        Expense.count(),
        Expense.aggregate("departmentId", "COUNT", { distinct: true }),
        Expense.count({
          where: {
            [Op.or]: [
              { currentStatus: ExpenseStatusEnum.PENDING_APPROVAL },
              { currentStatus: ExpenseStatusEnum.PENDING_ADDITIONAL_INFO },
            ],
          },
        }),
      ]);

    const responseData = {
      totalAmount: Number(totalAmount),
      expenses: totalExpenses,
      departments: totalDepartments,
      pending: pendingExpenses,
    };

    res.status(200).json(responseData);
  } catch (error) {
    next(error);
  }
};
