import { Request, Response, NextFunction } from "express";
import sequelize from "../config/database";
import Expense from "../models/Expense";
import ExpenseStatus from "../models/ExpenseStatus";
import Department from "../models/Department";
import User from "../models/User";
import { ExpenseStatusEnum, CurrencyEnum, NextApproverType } from "../types/expense";
import { Category } from "../models/Category";
import { buildExpenseQuery } from "../helpers/expensesQueryHelper";
import { WorkflowConfig } from "../config/workflow";
import { WorkflowOrchestrator } from "../services/workflowOrchestrator";
import { DepartmentPermission } from "../types/auth";
import { Rule, RuleStep } from "../models/Rule";
import { mapExpenseToDto } from "../helpers/expenseDTOHelper";

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
export class ExpenseController {
  private workflowOrchestrator: WorkflowOrchestrator;

  constructor() {
    // Get the singleton workflow configuration
    const workflowConfig = WorkflowConfig.getInstance();
    this.workflowOrchestrator = workflowConfig.orchestrator;
  }

  async createExpense(req: Request, res: Response, next: NextFunction) {
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

      await this.workflowOrchestrator.triggerWorkflow(expense.id);

      // fire service to define expense status

      res.status(201).json({
        message: "Expense created successfully",
        expenseId: expense.id
      });
    } catch (error) {
      await transaction.rollback();
      next(error);
    }
  }

  async approveExpense(req: Request, res: Response) {
    const { id } = req.params;

    if (id == null || typeof id !== "string" || !Number.isFinite(Number(id))) {
      res.status(400).json({ error: "Invalid expense id" });
      return;
    }

    const expense = await Expense.findByPk(id);

    if (!expense) {
      res.status(404).json({ error: "Expense not found" });
      return;
    }

    const user = await User.findByPk(req.user?.id);
    if (!user?.id) {
      return;
    }

    if (expense.nextApproverType === NextApproverType.USER && expense.nextApproverId === user.id) {
      await this.workflowOrchestrator.approveExpense(expense.id, user.id);
      res.status(200).json({ message: "Expense approved successfully" });
      return;
    }

    if (
      expense.nextApproverType === NextApproverType.DEPARTMENT &&
      expense.nextApproverId &&
      (await user.hasDepartmentPermissionString(
        expense.nextApproverId,
        DepartmentPermission.APPROVE_EXPENSES
      ))
    ) {
      await this.workflowOrchestrator.approveExpense(expense.id, user.id);
      res.status(200).json({ message: "Expense approved successfully" });
      return;
    }

    res.status(403).json({ error: "Not enough permissions to approve expense" });
  }

  async rejectExpense(req: Request, res: Response) {
    const { id } = req.params;

    if (id == null || typeof id !== "string" || !Number.isFinite(Number(id))) {
      res.status(400).json({ error: "Invalid expense id" });
      return;
    }

    const expense = await Expense.findByPk(id);

    if (!expense) {
      res.status(404).json({ error: "Expense not found" });
      return;
    }

    const user = await User.findByPk(req.user?.id);
    if (!user?.id) {
      return;
    }

    if (expense.nextApproverType === NextApproverType.USER && expense.nextApproverId === user.id) {
      await expense.update({
        currentStatus: ExpenseStatusEnum.REJECTED
      });
      res.status(200).json({ message: "Expense rejected successfully" });
      return;
    }

    if (
      expense.nextApproverType === NextApproverType.DEPARTMENT &&
      expense.nextApproverId &&
      (await user.hasDepartmentPermissionString(
        expense.nextApproverId,
        DepartmentPermission.APPROVE_EXPENSES
      ))
    ) {
      await expense.update({
        currentStatus: ExpenseStatusEnum.REJECTED
      });
      res.status(200).json({ message: "Expense rejected successfully" });
      return;
    }

    res.status(403).json({ error: "Not enough permissions to reject expense" });
  }

  async getExpenseById(req: Request, res: Response) {
    if (!req.user) {
      res.status(401).json({ error: "User not authenticated" });
      return;
    }

    const authenticatedUser = await User.findByPk(req.user.id);
    if (!authenticatedUser) {
      res.status(401).json({ error: "User not authenticated" });
      return;
    }

    const { id } = req.params;

    if (id == null || typeof id !== "string" || !Number.isFinite(Number(id))) {
      res.status(400).json({ error: "Invalid expense id" });
      return;
    }

    const expense = await Expense.findByPk(id, {
      include: [
        { model: User, as: "requester", attributes: ["id", "firstName", "lastName"] },
        { model: Category, as: "category", attributes: ["id", "name"] },
        { model: Department, as: "department", attributes: ["id", "name"] },
        {
          model: ExpenseStatus,
          as: "expenseStatuses",
          include: [{ model: User, as: "user", attributes: ["id", "firstName", "lastName"] }],
          attributes: ["id", "status", "comment"]
        },
        {
          model: Rule,
          as: "rule",
          include: [
            {
              model: RuleStep,
              as: "ruleSteps",
              include: [
                {
                  model: Department,
                  as: "approvingDepartment",
                  attributes: ["id", "name"]
                },
                {
                  model: User,
                  as: "approvingUser",
                  attributes: ["id", "firstName", "lastName"]
                }
              ],
              attributes: ["step", "approvingDepartmentId", "approvingUserId"]
            }
          ]
        }
      ]
    });

    if (!expense) {
      res.status(404).json({ error: "Expense not found" });
      return;
    }

    let nextApproverName: string | undefined = undefined;

    if (expense.nextApproverType === NextApproverType.USER && expense.nextApproverId) {
      const nextApprover = await User.findByPk(expense.nextApproverId);
      if (nextApprover) {
        nextApproverName = `${nextApprover.firstName} ${nextApprover.lastName}`;
      }
    }

    if (expense.nextApproverType === NextApproverType.DEPARTMENT && expense.nextApproverId) {
      const nextApprover = await Department.findByPk(expense.nextApproverId);
      if (nextApprover) {
        nextApproverName = nextApprover.name;
      }
    }

    res.status(200).json(mapExpenseToDto(expense, nextApproverName));
  }

  async listExpenses(req: Request, res: Response) {
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
  }
}
