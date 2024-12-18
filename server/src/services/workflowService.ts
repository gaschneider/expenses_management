import { Op, Transaction } from "sequelize";
import { Rule, RuleStep } from "../models/Rule";
import sequelize from "../config/database";
import Expense from "../models/Expense";
import Department from "../models/Department";
import User from "../models/User";
import { ExpenseStatusEnum, NextApproverType } from "../types/expense";
import { DepartmentPermission } from "../types/auth";

export interface ApprovalRoute {
  currentStep: number;
  totalSteps: number;
  nextApprover: {
    type: "department" | "user";
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
      currentStep: 1,
      totalSteps: rule.ruleSteps?.length || 0,
      nextApprover: firstStep.approvingDepartmentId
        ? {
            type: "department",
            id: firstStep.approvingDepartmentId
          }
        : firstStep.approvingUserId
        ? {
            type: "user",
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
        await expense.update({ currentStatus: ExpenseStatusEnum.REJECTED }, { transaction });
        await transaction.commit();
        return ExpenseStatusEnum.REJECTED;
      }

      // Validate current user's ability to approve
      const isValidApprover = await this.validateApprover(
        currentUserId,
        approvalRoute.nextApprover
      );

      if (!isValidApprover) {
        throw new Error("Unauthorized approver");
      }

      // Update expense status and tracking
      await expense.update(
        {
          currentStatus: ExpenseStatusEnum.PENDING_APPROVAL,
          currentRuleStep: approvalRoute.currentStep
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

  // Validate if current user can approve
  private async validateApprover(
    currentUserId: number,
    nextApprover: ApprovalRoute["nextApprover"]
  ): Promise<boolean> {
    if (!nextApprover) return false;

    if (nextApprover.type === "user") {
      return currentUserId === nextApprover.id;
    }

    if (nextApprover.type === "department") {
      // Check if user belongs to the approving department
      const user = await User.findByPk(currentUserId, {
        include: [{ model: Department, as: "departments" }]
      });

      if (!user) {
        return false;
      }

      return await user.hasDepartmentPermissionString(
        nextApprover.id,
        DepartmentPermission.APPROVE_EXPENSES
      );
    }

    return false;
  }

  // Move to next approval step
  async advanceToNextApprovalStep(
    expenseId: number,
    currentUserId: number
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
            include: [{ model: RuleStep, order: [["step", "ASC"]] }]
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
            currentRuleStep: null
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

      await transaction.commit();
      return ExpenseStatusEnum.PENDING_APPROVAL;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}
