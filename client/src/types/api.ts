export type UserDTO = {
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
  MANAGE_USER_DEPARTMENT_PERMISSIONS = "MANAGE_USER_DEPARTMENT_PERMISSIONS",
  ADMIN = "ADMIN"
}
