import { Request, Response, NextFunction } from "express";
import sequelize from "../config/database";
import Expense from "../models/Expense";
import ExpenseStatus from "../models/ExpenseStatus";
import Department from "../models/Department";
import User from "../models/User";
import {
  ExpenseStatusEnum,
  CurrencyEnum,
  NextApproverType,
  ExpenseUpdateDTO
} from "../types/expense";
import { Category } from "../models/Category";
import { buildExpenseQuery } from "../helpers/expensesQueryHelper";
import { WorkflowConfig } from "../config/workflow";
import { WorkflowOrchestrator } from "../services/workflowOrchestrator";
import { DepartmentPermission } from "../types/auth";
import { Rule, RuleStep } from "../models/Rule";
import { mapExpenseToDto } from "../helpers/expenseDTOHelper";
import { userHasPermission } from "../middlewares/checkPermission";

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

const STATUSES_NOT_ALLOWED_CANCEL = [
  ExpenseStatusEnum.APPROVED,
  ExpenseStatusEnum.CANCELLED,
  ExpenseStatusEnum.REJECTED
];
export class ExpenseController {
  private workflowOrchestrator: WorkflowOrchestrator;

  constructor() {
    // Get the singleton workflow configuration
    const workflowConfig = WorkflowConfig.getInstance();
    this.workflowOrchestrator = workflowConfig.orchestrator;

    this.updateExpense = this.updateExpense.bind(this);
    this.approveExpense = this.approveExpense.bind(this);
    this.rejectExpense = this.rejectExpense.bind(this);
    this.cancelExpense = this.cancelExpense.bind(this);
    this.createExpense = this.createExpense.bind(this);
    this.getExpenseById = this.getExpenseById.bind(this);
    this.listExpenses = this.listExpenses.bind(this);
    this.setAsDraftExpense = this.setAsDraftExpense.bind(this);
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

      await ExpenseStatus.create(
        {
          id: 0,
          expenseId: expense.id,
          status: isDraft ? ExpenseStatusEnum.DRAFT : ExpenseStatusEnum.WAITING_WORKFLOW,
          userId: requesterId,
          comment: null
        },
        { transaction }
      );

      // Commit transaction
      await transaction.commit();

      if (!isDraft) {
        await this.workflowOrchestrator.triggerWorkflow(expense.id);
      }

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

  async updateExpense(req: Request, res: Response) {
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

    if (expense.requesterId !== user.id) {
      res.status(403).json({ error: "Not enough permissions to update expense" });
      return;
    }

    if (
      expense.currentStatus !== ExpenseStatusEnum.DRAFT &&
      expense.currentStatus !== ExpenseStatusEnum.PENDING_ADDITIONAL_INFO
    ) {
      res.status(400).json({ error: "Expense isn't in status to be updated" });
      return;
    }

    const { amount, currency, justification, date, publish, comment } =
      req.body as ExpenseUpdateDTO;

    const updatedExpense: {
      amount?: number;
      currency?: CurrencyEnum;
      justification?: string;
      date?: Date;
      currentStatus?: ExpenseStatusEnum;
    } = {
      justification
    };

    if (expense.currentStatus === ExpenseStatusEnum.DRAFT) {
      updatedExpense.amount = amount;
      updatedExpense.currency = currency;
      updatedExpense.date = date;
      if (publish) {
        updatedExpense.currentStatus = ExpenseStatusEnum.WAITING_WORKFLOW;
      }
    } else if (publish) {
      updatedExpense.currentStatus = ExpenseStatusEnum.PENDING_APPROVAL;
    }

    await expense.update(updatedExpense);

    if (publish) {
      await ExpenseStatus.create({
        id: 0,
        expenseId: expense.id,
        status: ExpenseStatusEnum.WAITING_WORKFLOW,
        userId: user.id,
        comment
      });

      await this.workflowOrchestrator.triggerWorkflow(expense.id);
    }

    res.status(200).json({ message: "Expense updated successfully" });
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

    const { comment } = req.body as { comment?: string };

    if (expense.nextApproverType === NextApproverType.USER && expense.nextApproverId === user.id) {
      await this.workflowOrchestrator.approveExpense(expense.id, user.id, comment);
      res.status(200).json({ message: "Expense approved successfully" });
      return;
    }

    if (
      expense.nextApproverType === NextApproverType.DEPARTMENT &&
      user.id !== expense.requesterId &&
      expense.nextApproverId &&
      (await userHasPermission(user, DepartmentPermission.APPROVE_EXPENSES, expense.nextApproverId))
    ) {
      await this.workflowOrchestrator.approveExpense(expense.id, user.id, comment);
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

    const { comment } = req.body as { comment?: string };

    if (expense.nextApproverType === NextApproverType.USER && expense.nextApproverId === user.id) {
      await expense.update({
        currentStatus: ExpenseStatusEnum.REJECTED,
        ruleId: null,
        currentRuleStep: null,
        nextApproverType: null,
        nextApproverId: null
      });
      await ExpenseStatus.create({
        id: 0,
        expenseId: expense.id,
        status: ExpenseStatusEnum.REJECTED,
        userId: user.id,
        comment
      });
      res.status(200).json({ message: "Expense rejected successfully" });
      return;
    }

    if (
      expense.nextApproverType === NextApproverType.DEPARTMENT &&
      user.id !== expense.requesterId &&
      expense.nextApproverId &&
      (await userHasPermission(user, DepartmentPermission.APPROVE_EXPENSES, expense.nextApproverId))
    ) {
      await expense.update({
        currentStatus: ExpenseStatusEnum.REJECTED,
        ruleId: null,
        currentRuleStep: null,
        nextApproverType: null,
        nextApproverId: null
      });

      await ExpenseStatus.create({
        id: 0,
        expenseId: expense.id,
        status: ExpenseStatusEnum.REJECTED,
        userId: user.id,
        comment
      });

      res.status(200).json({ message: "Expense rejected successfully" });
      return;
    }

    res.status(403).json({ error: "Not enough permissions to reject expense" });
  }

  async requestInfoExpense(req: Request, res: Response) {
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

    const { comment } = req.body as { comment?: string };

    if (expense.nextApproverType === NextApproverType.USER && expense.nextApproverId === user.id) {
      await expense.update({
        currentStatus: ExpenseStatusEnum.PENDING_ADDITIONAL_INFO
      });
      await ExpenseStatus.create({
        id: 0,
        expenseId: expense.id,
        status: ExpenseStatusEnum.PENDING_ADDITIONAL_INFO,
        userId: user.id,
        comment
      });
      res.status(200).json({ message: "Requested more info for expense successfully" });
      return;
    }

    if (
      expense.nextApproverType === NextApproverType.DEPARTMENT &&
      user.id !== expense.requesterId &&
      expense.nextApproverId &&
      (await userHasPermission(user, DepartmentPermission.APPROVE_EXPENSES, expense.nextApproverId))
    ) {
      await expense.update({
        currentStatus: ExpenseStatusEnum.PENDING_ADDITIONAL_INFO
      });

      await ExpenseStatus.create({
        id: 0,
        expenseId: expense.id,
        status: ExpenseStatusEnum.PENDING_ADDITIONAL_INFO,
        userId: user.id,
        comment
      });

      res.status(200).json({ message: "Requested more info for expense successfully" });
      return;
    }

    res.status(403).json({ error: "Not enough permissions to request more info for expense" });
  }

  async cancelExpense(req: Request, res: Response) {
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

    const { comment } = req.body as { comment?: string };

    if (expense.requesterId !== user.id) {
      res.status(403).json({ error: "Not enough permissions to cancel expense" });
      return;
    }

    if (STATUSES_NOT_ALLOWED_CANCEL.includes(expense.currentStatus)) {
      res.status(400).json({ error: "Expense cannot be cancelled" });
      return;
    }

    await expense.update({
      currentStatus: ExpenseStatusEnum.CANCELLED,
      ruleId: null,
      currentRuleStep: null,
      nextApproverType: null,
      nextApproverId: null
    });

    await ExpenseStatus.create({
      id: 0,
      expenseId: expense.id,
      status: ExpenseStatusEnum.CANCELLED,
      userId: user.id,
      comment
    });

    res.status(200).json({ message: "Expense cancelled successfully" });
  }

  async setAsDraftExpense(req: Request, res: Response) {
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

    const { comment } = req.body as { comment?: string };

    if (expense.requesterId !== user.id) {
      res.status(403).json({ error: "Not enough permissions to set as draft expense" });
      return;
    }

    if (STATUSES_NOT_ALLOWED_CANCEL.includes(expense.currentStatus)) {
      res.status(400).json({ error: "Expense cannot be set to draft" });
      return;
    }

    await expense.update({
      currentStatus: ExpenseStatusEnum.DRAFT,
      ruleId: null,
      currentRuleStep: null,
      nextApproverType: null,
      nextApproverId: null
    });

    await ExpenseStatus.create({
      id: 0,
      expenseId: expense.id,
      status: ExpenseStatusEnum.DRAFT,
      userId: user.id,
      comment
    });

    res.status(200).json({ message: "Expense cancelled successfully" });
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
          attributes: ["id", "status", "comment", "createdAt"]
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
    let canApprove = expense.currentStatus === ExpenseStatusEnum.PENDING_APPROVAL;
    let canCancel =
      expense.requesterId === authenticatedUser.id &&
      !STATUSES_NOT_ALLOWED_CANCEL.includes(expense.currentStatus);

    if (expense.nextApproverType === NextApproverType.USER && expense.nextApproverId) {
      canApprove = canApprove && expense.nextApproverId === authenticatedUser.id;
      const nextApprover = await User.findByPk(expense.nextApproverId);
      if (nextApprover) {
        nextApproverName = `${nextApprover.firstName} ${nextApprover.lastName}`;
      }
    }

    if (expense.nextApproverType === NextApproverType.DEPARTMENT && expense.nextApproverId) {
      canApprove =
        canApprove &&
        authenticatedUser.id !== expense.requesterId &&
        (await userHasPermission(
          authenticatedUser,
          DepartmentPermission.APPROVE_EXPENSES,
          expense.nextApproverId
        ));
      const nextApprover = await Department.findByPk(expense.nextApproverId);
      if (nextApprover) {
        nextApproverName = nextApprover.name;
      }
    }

    res.status(200).json(mapExpenseToDto(expense, nextApproverName, canApprove, canCancel));
  }

  async listExpenses(req: Request, res: Response) {
    if (!req.user) {
      res.status(401).json({ error: "User not authenticated" });
      return;
    }

    const authenticatedUser = await User.findByPk(req.user.id, {
      include: { model: Department, as: "departments" }
    });
    if (!authenticatedUser) {
      res.status(401).json({ error: "User not authenticated" });
      return;
    }

    const {
      page = 1,
      pageSize = 10,
      status,
      departmentId,
      startDate,
      endDate,
      orderBy,
      orderDirection
    } = req.query as {
      page?: string;
      pageSize?: string;
      status?: string;
      departmentId?: string;
      startDate?: string;
      endDate?: string;
      orderBy?: string;
      orderDirection?: string;
    };

    let validOrderDirection = orderBy && orderDirection?.toLowerCase() === "asc" ? "asc" : "desc";

    const expenses = await Expense.findAndCountAll({
      where: buildExpenseQuery(authenticatedUser, { status, startDate, endDate, departmentId }),
      include: [
        { model: User, as: "requester", attributes: ["id", "firstName", "lastName"] },
        { model: Category, as: "category", attributes: ["id", "name"] },
        { model: Department, as: "department", attributes: ["id", "name"] }
      ],
      limit: Number(pageSize),
      offset: (Number(page) - 1) * Number(pageSize),
      order: [[orderBy ?? "createdAt", validOrderDirection]]
    });

    res.status(200).json({
      total: expenses.count,
      page: Number(page),
      pageSize: Number(pageSize),
      data: expenses.rows
    });
  }
}
