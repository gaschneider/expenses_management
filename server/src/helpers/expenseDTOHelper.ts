import Expense from "../models/Expense";
import { CurrencyEnum, ExpenseStatusEnum, NextApproverType } from "../types/expense";

// Base User DTO
interface UserBaseDto {
  id: number;
  firstName: string;
  lastName: string;
}

// Department DTO
interface DepartmentDto {
  id: number;
  name: string;
}

// Expense Status DTO
interface ExpenseStatusDto {
  id: number;
  status: string;
  comment: string | null;
  user: UserBaseDto;
}

// Rule Step DTO
interface RuleStepDto {
  step: number;
  approvingDepartmentId: number | null;
  approvingUserId: number | null;
  approvingDepartment: DepartmentDto | null;
  approvingUser: UserBaseDto | null;
}

// Rule DTO
interface RuleDto {
  id: number;
  ruleSteps: RuleStepDto[];
}

// Complete Expense DTO
interface ExpenseDto {
  // Base Expense fields
  id: number;
  categoryId: number;
  amount: number;
  date: Date;
  departmentId: number;
  title: string;
  justification: string;
  requesterId: number;
  projectId: number | null;
  costCenter: string | null;
  currency: CurrencyEnum;
  paymentDate: Date | null;
  currentStatus: ExpenseStatusEnum;
  ruleId: number | null;
  currentRuleStep: number | null;
  nextApproverType: NextApproverType | null;
  nextApproverId: number | null;
  nextApproverName?: string;
  canApprove: boolean;
  canCancel: boolean;

  // Nested relationships
  requester: UserBaseDto;
  category: DepartmentDto;
  department: DepartmentDto;
  expenseStatuses: ExpenseStatusDto[];
  rule: RuleDto | null;
}

// Conversion function to map Sequelize model to DTO
const mapExpenseToDto = (
  expense: Expense,
  nextApproverName?: string,
  canApprove = false,
  canCancel = false
): ExpenseDto => {
  return {
    // Base fields
    id: expense.id,
    categoryId: expense.categoryId,
    amount: expense.amount,
    date: expense.date,
    departmentId: expense.departmentId,
    title: expense.title,
    justification: expense.justification,
    requesterId: expense.requesterId,
    projectId: expense.projectId,
    costCenter: expense.costCenter,
    currency: expense.currency,
    paymentDate: expense.paymentDate,
    currentStatus: expense.currentStatus,
    ruleId: expense.ruleId,
    currentRuleStep: expense.currentRuleStep,
    nextApproverType: expense.nextApproverType,
    nextApproverId: expense.nextApproverId,
    nextApproverName,
    canApprove,
    canCancel,

    // Nested mappings
    requester: {
      id: expense.requester!.id!,
      firstName: expense.requester!.firstName,
      lastName: expense.requester!.lastName
    },

    category: {
      id: expense.category!.id!,
      name: expense.category!.name
    },

    department: {
      id: expense.department!.id!,
      name: expense.department!.name
    },

    expenseStatuses: expense.expenseStatuses
      ? expense.expenseStatuses.map((status) => ({
          id: status.id,
          status: status.status,
          comment: status.comment,
          user: {
            id: status.user!.id!,
            firstName: status.user!.firstName,
            lastName: status.user!.lastName
          }
        }))
      : [],

    rule: expense.rule
      ? {
          id: expense.rule.id,
          ruleSteps:
            expense.rule.ruleSteps?.map((step) => ({
              step: step.step,
              approvingDepartmentId: step.approvingDepartmentId,
              approvingUserId: step.approvingUserId,
              approvingDepartment: step.approvingDepartment
                ? {
                    id: step.approvingDepartment.id!,
                    name: step.approvingDepartment.name
                  }
                : null,
              approvingUser: step.approvingUser
                ? {
                    id: step.approvingUser.id!,
                    firstName: step.approvingUser.firstName,
                    lastName: step.approvingUser.lastName
                  }
                : null
            })) ?? []
        }
      : null
  };
};

export { ExpenseDto, mapExpenseToDto };
