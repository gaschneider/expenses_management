import { Op, WhereOptions } from "sequelize";
import User from "../models/User";
import { userHasPermission } from "../middlewares/checkPermission";
import { DepartmentPermission } from "../types/auth";

export const buildDataAnalysisQuery = async (
  authenticatedUser: User,
  { startDate, endDate, departmentId }: any
): Promise<WhereOptions> => {
  const whereConditions: WhereOptions = {};

  if (startDate && endDate) {
    whereConditions.date = {
      [Op.between]: [new Date(startDate), new Date(endDate)]
    };
  } else if (startDate) {
    whereConditions.date = {
      [Op.gte]: new Date(startDate)
    };
  } else if (endDate) {
    whereConditions.date = {
      [Op.lte]: new Date(endDate)
    };
  }

  // Get accessible department IDs with proper null checks
  const accessibleDepartmentIdsPromises = new Map<string, Promise<boolean>>();

  if (authenticatedUser.departments) {
    for (let index = 0; index < authenticatedUser.departments?.length; index++) {
      const dept = authenticatedUser.departments[index];
      accessibleDepartmentIdsPromises.set(
        dept.id?.toString() ?? "",
        userHasPermission(authenticatedUser, DepartmentPermission.VIEW_DEPARTMENT_DATA_ANALYSIS, dept.id)
      );
    }
  }

  const accessibleDepartmentIds: string[] = [];

  await Promise.all(
    Array.from(accessibleDepartmentIdsPromises).map(async ([deptId, promise]) => {
      if (await promise) accessibleDepartmentIds.push(deptId);
    })
  );

  let departmentIdCondition = null;

  // Add specific department filter if provided
  if (departmentId && accessibleDepartmentIds.includes(departmentId)) {
    departmentIdCondition = departmentId;
  } else if (!departmentId) {
    departmentIdCondition = { [Op.in]: accessibleDepartmentIds };
  }else{
    departmentIdCondition = -1;
  }

  const orConditions = [];

  if (departmentIdCondition !== null) {
    orConditions.push({ departmentId: departmentIdCondition });
  }

  // Add the OR conditions to the where clause
  whereConditions[Op.or as any] = orConditions;

  return whereConditions;
};
