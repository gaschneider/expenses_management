export interface ExpenseAttributes {
  id: number;
  category: string;
  amount: number;
  date: Date;
  departmentId: number;
  justification: string;
  requesterId: number;
  projectId: number | null;
  costCenter: string;
  currency: CurrencyEnum;
  paymentDate: Date | null;
  currentStatus: ExpenseStatusEnum;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ExpenseStatusAttributes {
  id: number;
  expenseId: number;
  status: ExpenseStatusEnum;
  userId: number;
  comment: string | null;
  attachments?: string | null;
  nextApproverId: number | null;
  dueDate: Date | null;
  readonly createdAt?: Date;
  readonly updatedAt?: Date;
}

export enum ExpenseStatusEnum {
  DRAFT = "DRAFT",
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
