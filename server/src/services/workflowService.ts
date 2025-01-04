import { Op, Transaction } from "sequelize";
import { Rule, RuleStep } from "../models/Rule";
import sequelize from "../config/database";
import Expense from "../models/Expense";
import Department from "../models/Department";
import User from "../models/User";
import { ExpenseStatusEnum, NextApproverType } from "../types/expense";
import { DepartmentPermission } from "../types/auth";
import ExpenseStatus from "../models/ExpenseStatus";

export interface ApprovalRoute {
  ruleId: number;
  currentStep: number;
  totalSteps: number;
  nextApprover: {
    type: NextApproverType;
    id: number;
  } | null;
}

export class RuleBasedWorkflowService {
  // Find applicable rule for an expense
  async findApplicableRule(expense: Expense): Promise<Rule | null> {
    const rule = await Rule.findOne({
      where: {
        departmentId: expense.departmentId,
        minValue: { [Op.lte]: expense.amount },
        maxValue: { [Op.gte]: expense.amount }
      },
      include: [
        {
          model: RuleStep,
          as: "ruleSteps",
          order: [["step", "ASC"]]
        }
      ]
    });

    return rule;
  }

  // Determine initial approval route
  async determineInitialApprovalRoute(expense: Expense): Promise<ApprovalRoute | null> {
    const rule = await this.findApplicableRule(expense);

    if (!rule) {
      // No applicable rule found
      return null;
    }

    // Get first step
    const firstStep = rule.ruleSteps?.[0];

    if (!firstStep) {
      return null;
    }

    return {
      ruleId: rule.id,
      currentStep: 1,
      totalSteps: rule.ruleSteps?.length || 0,
      nextApprover: firstStep.approvingDepartmentId
        ? {
            type: NextApproverType.DEPARTMENT,
            id: firstStep.approvingDepartmentId
          }
        : firstStep.approvingUserId
        ? {
            type: NextApproverType.USER,
            id: firstStep.approvingUserId
          }
        : null
    };
  }

  // Process expense through workflow
  async processExpenseWorkflow(
    expenseId: number,
    currentUserId: number
  ): Promise<ExpenseStatusEnum> {
    const transaction = await sequelize.transaction();

    try {
      // Fetch expense with all details
      const expense = await Expense.findByPk(expenseId, {
        transaction,
        include: [
          { model: Department, as: "department" },
          { model: User, as: "requester" }
        ]
      });

      if (!expense) {
        throw new Error("Expense not found");
      }

      // Determine initial approval route
      const approvalRoute = await this.determineInitialApprovalRoute(expense);

      if (!approvalRoute) {
        // No applicable rule - auto reject
        await expense.update(
          {
            currentStatus: ExpenseStatusEnum.REJECTED,
            currentRuleStep: null,
            ruleId: null,
            nextApproverType: null,
            nextApproverId: null
          },
          { transaction }
        );
        await transaction.commit();
        return ExpenseStatusEnum.REJECTED;
      }

      // Update expense status and tracking
      await expense.update(
        {
          currentStatus: ExpenseStatusEnum.PENDING_APPROVAL,
          currentRuleStep: approvalRoute.currentStep,
          ruleId: approvalRoute.ruleId,
          nextApproverType: approvalRoute.nextApprover?.type,
          nextApproverId: approvalRoute.nextApprover?.id
        },
        { transaction }
      );

      await transaction.commit();
      return ExpenseStatusEnum.PENDING_APPROVAL;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  // Move to next approval step
  async advanceToNextApprovalStep(
    expenseId: number,
    currentUserId: number,
    comment?: string
  ): Promise<ExpenseStatusEnum> {
    const transaction = await sequelize.transaction();

    try {
      // Fetch expense with rule and current step
      const expense = await Expense.findByPk(expenseId, {
        transaction,
        include: [
          {
            model: Rule,
            as: "rule",
            include: [{ model: RuleStep, as: "ruleSteps", order: [["step", "ASC"]] }]
          }
        ]
      });

      if (!expense) {
        throw new Error("Expense not found");
      }

      const rule = expense.rule;
      const currentStep = expense.currentRuleStep ?? 0;

      // Find next step
      const nextRuleStep = rule?.ruleSteps?.find((step) => step.step === currentStep + 1);

      if (!nextRuleStep) {
        // No more steps - auto approve
        await expense.update(
          {
            currentStatus: ExpenseStatusEnum.APPROVED,
            currentRuleStep: null,
            ruleId: null,
            nextApproverType: null,
            nextApproverId: null
          },
          { transaction }
        );
        await ExpenseStatus.create(
          {
            id: 0,
            expenseId: expense.id,
            status: ExpenseStatusEnum.APPROVED,
            userId: currentUserId,
            comment: null
          },
          { transaction }
        );
        await transaction.commit();
        return ExpenseStatusEnum.APPROVED;
      }

      // Determine next approver
      const nextApprover = nextRuleStep.approvingDepartmentId
        ? {
            type: NextApproverType.DEPARTMENT,
            id: nextRuleStep.approvingDepartmentId
          }
        : nextRuleStep.approvingUserId
        ? {
            type: NextApproverType.USER,
            id: nextRuleStep.approvingUserId
          }
        : null;

      // Validate and update
      await expense.update(
        {
          currentStatus: ExpenseStatusEnum.PENDING_APPROVAL,
          currentRuleStep: nextRuleStep.step,
          nextApproverType: nextApprover?.type,
          nextApproverId: nextApprover?.id
        },
        { transaction }
      );

      await ExpenseStatus.create(
        {
          id: 0,
          expenseId: expense.id,
          status: ExpenseStatusEnum.APPROVED,
          userId: currentUserId,
          comment
        },
        { transaction }
      );

      await transaction.commit();
      return ExpenseStatusEnum.PENDING_APPROVAL;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}
