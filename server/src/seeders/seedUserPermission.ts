import Department from "../models/Department";
import User from "../models/Users";
import UserPermission from "../models/UserPermission";
import { DepartmentPermission, SystemPermission } from "../types/auth";

export const seedUserPermission = async () => {
  let user = await User.findOne({ where: { email: "admin@example.com" } });
  if (!user) {
    user = await User.create({
      email: "admin@example.com",
      firstName: "Admin",
      lastName: "Example",
      password: "admin123"
    });
  }

  let userPermission = await UserPermission.findOne({ where: { userId: user.id } });
  if (!userPermission && user.id) {
    user.addUserPermissionString(SystemPermission.ADMIN);
  }

  let department = await Department.findOne({ where: { name: "IT" } });
  if (!department) {
    department = await Department.create({
      name: "IT",
      description: "Technology"
    });
    if (user.id) {
      department.addUserPermissionString(user.id, DepartmentPermission.VIEW_EXPENSES);
    }
  }
};
