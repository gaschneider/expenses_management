import { Request, Response, NextFunction } from "express";
import { Op } from "sequelize";
import sequelize from "../config/database";
import Expense from "../models/Expense";
import ExpenseStatus from "../models/ExpenseStatus";
import Department from "../models/Department";
import User from "../models/User";
import { ExpenseStatusEnum, CurrencyEnum } from "../types/expense";
import { Category } from "../models/Category";
import { userHasPermission } from "../middlewares/checkPermission";
import { DepartmentPermission } from "../types/auth";
import { buildExpenseQuery } from "../helpers/expensesQueryHelper";

interface ExpenseCreateDTO {
  categoryId: number;
  amount: number;
  date: Date;
  departmentId: number;
  title: string;
  justification: string;
  // projectId?: number | null;
  // costCenter: string;
  currency: CurrencyEnum;
  isDraft: boolean;
}

export const createExpense = async (req: Request, res: Response, next: NextFunction) => {
  const transaction = await sequelize.transaction();

  try {
    // Ensure user is authenticated
    if (!req.user) {
      res.status(401).json({ error: "User not authenticated" });
      return;
    }
    const requesterId = (req.user as User).id!;

    // Extract expense data
    const {
      categoryId,
      amount,
      date,
      departmentId,
      title,
      justification,
      // projectId,
      // costCenter,
      currency,
      isDraft
    } = req.body as ExpenseCreateDTO;

    // Validate department
    const department = await Department.findByPk(departmentId, { transaction });
    if (!department) {
      res.status(400).json({ error: "Invalid department" });
      return;
    }

    const category = await Category.findByPk(categoryId, { transaction });
    if (!category || (category.departmentId && category.departmentId != departmentId)) {
      res.status(400).json({ error: "Invalid category" });
      return;
    }

    // Create expense
    const expense = await Expense.create(
      {
        id: 0,
        categoryId,
        amount,
        date,
        departmentId,
        title,
        justification,
        requesterId,
        currency,
        currentStatus: isDraft ? ExpenseStatusEnum.DRAFT : ExpenseStatusEnum.WAITING_WORKFLOW
      },
      { transaction }
    );

    // Commit transaction
    await transaction.commit();

    // fire service to define expense status

    res.status(201).json({
      message: "Expense created successfully",
      expenseId: expense.id
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

export const getExpenseById = async (req: Request, res: Response) => {
  const { id } = req.params;

  if (id == null || typeof id !== "string" || !Number.isFinite(Number(id))) {
    return res.status(400).json({ error: "Invalid expense id" });
  }

  const expense = await Expense.findByPk(id, {
    include: [
      { model: User, as: "requester", attributes: ["id", "firstName", "lastName"] },
      { model: Department, as: "department", attributes: ["id", "name"] },
      {
        model: ExpenseStatus,
        include: [
          { model: User, as: "user", attributes: ["id", "firstName", "lastName"] },
          { model: User, as: "nextApprover", attributes: ["id", "firstName", "lastName"] }
        ]
      }
    ]
  });

  if (!expense) {
    res.status(404).json({ error: "Expense not found" });
    return;
  }

  res.status(200).json(expense);
};

export const listExpenses = async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: "User not authenticated" });
    return;
  }

  const authenticatedUser = await User.findByPk(req.user.id);
  if (!authenticatedUser) {
    res.status(401).json({ error: "User not authenticated" });
    return;
  }

  const { page = 1, pageSize = 10, status, departmentId, startDate, endDate } = req.query;

  const expenses = await Expense.findAndCountAll({
    where: buildExpenseQuery(authenticatedUser, { status, startDate, endDate, departmentId }),
    include: [
      { model: User, as: "requester", attributes: ["id", "firstName", "lastName"] },
      { model: Category, as: "category", attributes: ["id", "name"] },
      { model: Department, as: "department", attributes: ["id", "name"] }
    ],
    limit: Number(pageSize),
    offset: (Number(page) - 1) * Number(pageSize),
    order: [["createdAt", "DESC"]]
  });

  res.status(200).json({
    total: expenses.count,
    page: Number(page),
    pageSize: Number(pageSize),
    data: expenses.rows
  });
};
