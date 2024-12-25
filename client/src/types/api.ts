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
  VIEW_DATA_ANALYSIS = "VIEW_DATA_ANALYSIS",
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
