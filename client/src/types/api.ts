export type UserAuthDTO = {
  id?: number;
  firstName: string;
  lastName: string;
  email: string;
  permissions: string;
  departments: Record<number, string>;
};

export type DepartmentDTO = {
  id?: number;
  name: string;
  description: string;
};

export type BaseUserDTO = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
};

export type UserWithPermissionsDTO = BaseUserDTO & {
  systemPermissions: SystemPermission[];
  departments: UserDepartmentForPermissionManagementDTO[];
};

export interface UserDepartmentForPermissionManagementDTO {
  departmentId: number;
  departmentName: string;
  permissions: DepartmentPermission[];
}

export enum DepartmentPermission {
  VIEW_EXPENSES = "VIEW_EXPENSES",
  CREATE_EXPENSES = "CREATE_EXPENSES",
  APPROVE_EXPENSES = "APPROVE_EXPENSES",
  REJECT_EXPENSES = "REJECT_EXPENSES",
  CREATE_WORKFLOW_RULES = "CREATE_WORKFLOW_RULES",
  EDIT_WORKFLOW_RULES = "EDIT_WORKFLOW_RULES",
  DELETE_WORKFLOW_RULES = "DELETE_WORKFLOW_RULES"
}

export enum SystemPermission {
  CREATE_DEPARTMENT = "CREATE_DEPARTMENT",
  EDIT_DEPARTMENT = "EDIT_DEPARTMENT",
  DELETE_DEPARTMENT = "DELETE_DEPARTMENT",
  MANAGE_USER_SYSTEM_PERMISSIONS = "MANAGE_USER_SYSTEM_PERMISSIONS",
  MANAGE_USER_DEPARTMENT_PERMISSIONS = "MANAGE_USER_DEPARTMENT_PERMISSIONS",
  MANAGE_RULES = "MANAGE_RULES",
  MANAGE_CATEGORIES = "MANAGE_CATEGORIES",
  ADMIN = "ADMIN"
}

export interface RuleToCreateDTO {
  departmentId: number;
  minValue: number;
  maxValue: number;
  canBeSingleApproved: boolean;
  ruleSteps: RuleStepDTO[];
}

export interface RuleDTO {
  id: number;
  departmentId: number;
  minValue: number;
  maxValue: number;
  canBeSingleApproved: boolean;
  department: DepartmentDTO;
  ruleSteps: RuleStepDTO[];
}

export interface RuleStepDTO {
  id?: number;
  ruleId?: number;
  step?: number;
  approvingDepartmentId: number | null;
  approvingUserId: number | null;
  approvingDepartment?: DepartmentDTO;
  approvingUser?: BaseUserDTO;
}

export interface CategoryDTO {
  id: number;
  departmentId?: number;
  name: string;
  department?: DepartmentDTO;
}

export interface CategoryCreateDTO {
  departmentId?: number;
  name: string;
}

export interface ExpenseDTO {
  id: number;
  departmentId: number;
  department: DepartmentDTO;
  categoryId: number;
  category: CategoryDTO;
  requesterId: number;
  requester: Omit<BaseUserDTO, "email">;
  amount: number;
  currency: CurrencyEnum;
  title: string;
  justification: string;
  currentStatus: ExpenseStatusEnum;
  date: Date;
}

export interface ExpenseRuleDTO {
  id: number;
  ruleSteps: RuleStepDTO[];
}

export type ExpenseStatusDTO = {
  id: number;
  status: ExpenseStatusEnum;
  comment: string | null;
  user: Omit<BaseUserDTO, "email">;
};

export type ViewExpenseDTO = ExpenseDTO & {
  ruleId: number | null;
  currentRuleStep: number | null;
  nextApproverType: NextApproverType | null;
  nextApproverId: number | null;
  nextApproverName?: string;
  canApprove: boolean;
  canCancel: boolean;

  // Nested relationships
  requester: Omit<BaseUserDTO, "email">;
  category: CategoryDTO;
  department: DepartmentDTO;
  expenseStatuses: ExpenseStatusDTO[];
  rule: ExpenseRuleDTO | null;
};

export interface ExpenseFilterParams {
  departmentId?: number;
  categoryId?: number;
  status?: ExpenseStatusEnum;
  requesterId?: number;
}

export enum CurrencyEnum {
  BRL = "BRL",
  USD = "USD",
  EUR = "EUR"
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

export type CreateExpenseDTO = {
  departmentId: string;
  categoryId: string;
  date: Date;
  amount: string;
  currency: CurrencyEnum;
  title: string;
  justification: string;
  isDraft: boolean;
};

export enum NextApproverType {
  USER = "USER",
  DEPARTMENT = "DEPARTMENT"
}
