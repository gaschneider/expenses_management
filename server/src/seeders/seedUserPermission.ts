import User from "../models/User";
import UserPermission from "../models/UserPermission";
import { SystemPermission } from "../types/auth";

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
};
