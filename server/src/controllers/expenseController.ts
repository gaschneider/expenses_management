import { Request, Response, NextFunction } from "express";
import { Op } from "sequelize";
import sequelize from "../config/database";
import Expense from "../models/Expense";
import ExpenseStatus from "../models/ExpenseStatus";
import Department from "../models/Department";
import User from "../models/User";
import { ExpenseStatusEnum, CurrencyEnum, ExpenseAttributes } from "../types/expense";
import { DepartmentPermission } from "../types/auth";
import { Rule } from "../models/Rule";

interface ExpenseCreateDTO {
  category: string;
  amount: number;
  date: Date;
  departmentId: number;
  justification: string;
  projectId?: number | null;
  costCenter: string;
  currency: CurrencyEnum;
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
    const { category, amount, date, departmentId, justification, projectId, costCenter, currency } =
      req.body as ExpenseCreateDTO;

    // Validate department
    const department = await Department.findByPk(departmentId, { transaction });
    if (!department) {
      res.status(400).json({ error: "Invalid department" });
      return;
    }

    // Find applicable approval rule
    const applicableRule = await Rule.findOne({
      where: {
        departmentId,
        minValue: { [Op.lte]: amount },
        maxValue: { [Op.gte]: amount }
      },
      include: [{ model: Rule.associations.ruleSteps.target, as: "ruleSteps" }],
      transaction
    });

    if (!applicableRule) {
      res.status(400).json({
        error: "No approval rule found for this expense amount in the department"
      });
      return;
    }

    // Create expense
    const expense = await Expense.create(
      {
        id: 0,
        category,
        amount,
        date,
        departmentId,
        justification,
        requesterId,
        projectId,
        costCenter,
        currency,
        currentStatus: ExpenseStatusEnum.PENDING_APPROVAL
      },
      { transaction }
    );

    // Determine first approval step
    const firstStep = applicableRule.ruleSteps?.sort((a, b) => a.step - b.step)[0];
    if (!firstStep) {
      await transaction.rollback();
      res.status(400).json({ error: "No approval steps defined for this rule" });
      return;
    }

    // Determine first approver (department or user)
    let nextApproverId: number | null = null;
    if (firstStep.approvingUserId) {
      nextApproverId = firstStep.approvingUserId;
    } else if (firstStep.approvingDepartmentId) {
      // If department is approving, find a user with approval permissions
      const departmentApprovers = await department.getUsersWithPermission(
        DepartmentPermission.APPROVE_EXPENSES
      );

      if (departmentApprovers.length === 0) {
        await transaction.rollback();
        res.status(400).json({
          error: "No approvers found for the department"
        });
        return;
      }

      // Choose first approver (could implement round-robin or other selection logic)
      nextApproverId = departmentApprovers[0].id!;
    }

    // Create initial expense status
    await ExpenseStatus.create(
      {
        id: 0,
        expenseId: expense.id,
        status: ExpenseStatusEnum.DRAFT,
        userId: requesterId,
        nextApproverId,
        comment: "Expense created and awaiting initial approval"
      },
      { transaction }
    );

    // Commit transaction
    await transaction.commit();

    res.status(201).json({
      message: "Expense created successfully",
      expenseId: expense.id,
      nextApproverId
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
  const { page = 1, pageSize = 10, status, departmentId, startDate, endDate } = req.query;

  const whereConditions: any = {};

  if (status) whereConditions.currentStatus = status;
  if (departmentId) whereConditions.departmentId = departmentId;
  if (startDate && endDate) {
    whereConditions.date = {
      [Op.between]: [new Date(startDate as string), new Date(endDate as string)]
    };
  }

  const expenses = await Expense.findAndCountAll({
    where: whereConditions,
    include: [
      { model: User, as: "requester", attributes: ["id", "firstName", "lastName"] },
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
