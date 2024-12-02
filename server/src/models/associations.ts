import Department from "./Department";
import Expense from "./Expense";
import ExpenseStatus from "./ExpenseStatus";
import PermissionAuditLog from "./PermissionAuditLog";
import { Rule, RuleStep } from "./Rule";
import User from "./User";
import UserDepartmentPermission from "./UserDepartmentPermission";
import UserPermission from "./UserPermission";

export const defineAssociations = () => {
  // User - UserPermission Association
  User.hasOne(UserPermission, {
    foreignKey: "userId",
    as: "userPermission",
    onDelete: "CASCADE"
  });
  UserPermission.belongsTo(User, {
    foreignKey: "userId",
    as: "user"
  });

  // User - Department Association (through UserDepartmentPermission)
  User.belongsToMany(Department, {
    through: UserDepartmentPermission,
    foreignKey: "userId",
    as: "departments",
    onDelete: "CASCADE"
  });
  Department.belongsToMany(User, {
    through: UserDepartmentPermission,
    foreignKey: "departmentId",
    as: "users",
    onDelete: "CASCADE"
  });

  User.hasMany(UserDepartmentPermission, {
    foreignKey: "userId",
    as: "userDepartmentPermissions"
  });
  Department.hasMany(UserDepartmentPermission, {
    foreignKey: "departmentId",
    as: "userDepartmentPermissions"
  });

  // UserDepartmentPermission associations
  UserDepartmentPermission.belongsTo(User, {
    foreignKey: "userId",
    as: "user"
  });
  UserDepartmentPermission.belongsTo(Department, {
    foreignKey: "departmentId",
    as: "department"
  });

  // Expenses association

  Expense.hasMany(ExpenseStatus, {
    foreignKey: "expenseId",
    as: "expenseStatuses"
  });

  Expense.belongsTo(Department, {
    foreignKey: "departmentId",
    as: "department"
  });

  Expense.belongsTo(User, {
    foreignKey: "requesterId",
    as: "requester"
  });

  ExpenseStatus.belongsTo(Expense, {
    foreignKey: "expenseId",
    as: "expense"
  });

  ExpenseStatus.belongsTo(User, {
    foreignKey: "userId",
    as: "user"
  });

  ExpenseStatus.belongsTo(User, {
    foreignKey: "nextApproverId",
    as: "nextApprover"
  });

  // PermissionAuditLog - User Association
  User.hasMany(PermissionAuditLog, {
    foreignKey: "targetUserId",
    as: "targetUser"
  });

  PermissionAuditLog.belongsTo(User, {
    foreignKey: "targetUserId",
    as: "targetUser"
  });

  User.hasMany(PermissionAuditLog, {
    foreignKey: "performedByUserId",
    as: "performedByUser"
  });

  PermissionAuditLog.belongsTo(User, {
    foreignKey: "performedByUserId",
    as: "performedByUser"
  });

  Department.hasMany(PermissionAuditLog, {
    foreignKey: "departmentId",
    as: "department"
  });

  PermissionAuditLog.belongsTo(Department, {
    foreignKey: "departmentId",
    as: "department"
  });

  // Rules - RuleSteps
  Rule.belongsTo(Department, {
    foreignKey: "departmentId",
    as: "department"
  });

  Rule.hasMany(RuleStep, {
    foreignKey: "ruleId",
    as: "ruleSteps"
  });

  RuleStep.belongsTo(Rule, {
    foreignKey: "ruleId",
    as: "rule"
  });

  RuleStep.belongsTo(Department, {
    foreignKey: "approvingDepartmentId",
    as: "approvingDepartment"
  });

  RuleStep.belongsTo(User, {
    foreignKey: "approvingUserId",
    as: "approvingUser"
  });
};
