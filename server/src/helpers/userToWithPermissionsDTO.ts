import Department from "../models/Department";
import User from "../models/User";

export type UserWithPermissionsDTO = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  systemPermissions: string[];
  departments: {
    departmentId: number;
    departmentName: string;
    permissions: string[];
  }[];
};

export const userToWithPermissionsDTO = async (user: User) => {
  const departmentsByUser = await user.getDepartments();
  const userDepartmentPermissionsPromises = departmentsByUser.map(async (d: Department) => ({
    departmentId: d.id!,
    departmentName: d.name,
    permissions: await d.getUserPermissionStrings(user.id!)
  }));

  const userDepartmentPermissions = await Promise.all(userDepartmentPermissionsPromises);

  return {
    id: user.id!,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    systemPermissions: await user.getUserPermissionStrings(),
    departments: userDepartmentPermissions
  } as UserWithPermissionsDTO;
};
