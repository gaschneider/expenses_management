export interface ExpenseAttributes {
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
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ExpenseStatusAttributes {
  id: number;
  expenseId: number;
  status: ExpenseStatusEnum;
  userId: number;
  comment: string | null;
  readonly createdAt?: Date;
  readonly updatedAt?: Date;
}

export enum ExpenseStatusEnum {
  DRAFT = "DRAFT",
  WAITING_WORKFLOW = "WAITING_WORKFLOW",
  PENDING_APPROVAL = "PENDING_APPROVAL",
  PENDING_ADDITIONAL_INFO = "PENDING_ADDITIONAL_INFO",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  CANCELLED = "CANCELLED"
}

export enum CurrencyEnum {
  BRL = "BRL",
  CAD = "CAD",
  USD = "USD"
}

export enum NextApproverType {
  USER = "USER",
  DEPARTMENT = "DEPARTMENT"
}
