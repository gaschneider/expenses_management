import { Op, WhereOptions } from "sequelize";
import User from "../models/User";
import { userHasPermission } from "../middlewares/checkPermission";
import { DepartmentPermission } from "../types/auth";

export const buildExpenseQuery = async (
  authenticatedUser: User,
  { status, startDate, endDate, departmentId }: any
): Promise<WhereOptions> => {
  const whereConditions: WhereOptions = {};

  // Status and date filtering
  if (status) whereConditions.currentStatus = status;
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
        Promise.resolve(
          (await userHasPermission(
            authenticatedUser,
            DepartmentPermission.APPROVE_EXPENSES,
            dept.id
          )) ||
            (await userHasPermission(
              authenticatedUser,
              DepartmentPermission.VIEW_EXPENSES,
              dept.id
            ))
        )
      );
    }
  }

  const accessibleDepartmentIds: string[] = [];

  await Promise.all(
    Array.from(accessibleDepartmentIdsPromises).map(async ([deptId, promise]) => {
      if (await promise) accessibleDepartmentIds.push(deptId);
    })
  );

  // Add specific department filter if provided
  if (departmentId && accessibleDepartmentIds.includes(departmentId)) {
    whereConditions.departmentId = departmentId;
    return whereConditions;
  }

  // Add the OR conditions to the where clause
  whereConditions[Op.or as any] = [
    { departmentId: { [Op.in]: accessibleDepartmentIds } },
    { requesterId: authenticatedUser.id }
  ];

  return whereConditions;
};
