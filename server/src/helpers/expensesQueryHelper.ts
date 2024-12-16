import { Op, WhereOptions } from "sequelize";
import User from "../models/User";
import { userHasPermission } from "../middlewares/checkPermission";
import { DepartmentPermission } from "../types/auth";

interface WhereConditions {
  currentStatus?: string;
  date?: { [Op.between]: Date[] };
  departmentId?: number | { [Op.or]: any[] };
  requesterId?: number;
}

export const buildExpenseQuery = (
  authenticatedUser: User,
  { status, startDate, endDate, departmentId }: any
): WhereOptions => {
  const whereConditions: WhereOptions = {};

  // Status and date filtering
  if (status) whereConditions.currentStatus = status;
  if (startDate && endDate) {
    whereConditions.date = {
      [Op.between]: [new Date(startDate), new Date(endDate)]
    };
  }

  // Get accessible department IDs with proper null checks
  const accessibleDepartmentIds =
    authenticatedUser.departments
      ?.filter(
        (dept) =>
          userHasPermission(authenticatedUser, DepartmentPermission.APPROVE_EXPENSES, dept.id) ||
          userHasPermission(authenticatedUser, DepartmentPermission.VIEW_EXPENSES, dept.id)
      )
      .map((dept) => dept.id) ?? [];

  // Unified permission handling
  const departmentFilter: { [Op.or]?: any[] } = {};

  if (accessibleDepartmentIds.length > 0) {
    departmentFilter[Op.or] = [{ departmentId: { [Op.in]: accessibleDepartmentIds } }];
  }

  // Add specific department filter if provided
  if (departmentId) {
    (departmentFilter[Op.or] ??= []).push({ departmentId });
  }

  // Ensure user can always see their own requests
  whereConditions.requesterId = authenticatedUser.id;

  // Combine department filters if they exist
  if (Object.keys(departmentFilter).length > 0) {
    whereConditions.departmentId = departmentFilter as any;
  }

  return whereConditions;
};
