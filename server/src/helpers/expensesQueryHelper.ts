import { Op, WhereOptions } from "sequelize";
import User from "../models/User";
import { userHasPermission } from "../middlewares/checkPermission";
import { DepartmentPermission } from "../types/auth";

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

  let departmentIdCondition = null;

  // Add specific department filter if provided
  if (departmentId && accessibleDepartmentIds.includes(departmentId)) {
    departmentIdCondition = departmentId;
  } else if (!departmentId && accessibleDepartmentIds.length > 0) {
    departmentIdCondition = { [Op.in]: accessibleDepartmentIds };
  }

  const orConditions = [];

  if (departmentIdCondition !== null) {
    orConditions.push({ departmentId: departmentIdCondition });
  }

  orConditions.push({ requesterId: authenticatedUser.id });

  // Add the OR conditions to the where clause
  whereConditions[Op.or as any] = orConditions;

  return whereConditions;
};
