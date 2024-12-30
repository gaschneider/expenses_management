import { Op, WhereOptions } from "sequelize";
import User from "../models/User";
import { userHasPermission } from "../middlewares/checkPermission";
import { DepartmentPermission } from "../types/auth";

export const buildDataAnalysisQuery = (
  authenticatedUser: User
): WhereOptions => {
  const whereConditions: WhereOptions = {};

  // Get accessible department IDs with proper null checks
  const accessibleDepartmentIds =
    authenticatedUser.departments
      ?.filter(
        (dept) =>
          userHasPermission(authenticatedUser, DepartmentPermission.VIEW_DEPARTMENT_DATA_ANALYSIS, dept.id)
      )
      .map((dept) => dept.id?.toString()) ?? [];

  let departmentIdCondition = null;


  if (accessibleDepartmentIds.length > 0) {
    departmentIdCondition = { [Op.in]: accessibleDepartmentIds };
  }

  const orConditions = [];

  if (departmentIdCondition !== null) {
    orConditions.push({ departmentId: departmentIdCondition });
  }

  // Add the OR conditions to the where clause
  whereConditions[Op.or as any] = orConditions;

  return whereConditions;
};
