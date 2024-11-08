import Group from "../models/group";
import Permission from "../models/permission";
import User from "../models/user";

export const seedUserPermission = async () => {
  let financeGroup = await Group.findOne({ where: { name: "Finance Team" } });
  if (!financeGroup) {
    financeGroup = await Group.create({
      name: "Finance Team",
      description: "Finance department members"
    });
  }

  let financePermission = await Permission.findOne({ where: { name: "finance" } });
  if (!financePermission) {
    financePermission = await Permission.create({
      name: "finance",
      description: "Can approve/reject expenses"
    });
  }

  if (financeGroup && financePermission) {
    await financeGroup.addPermission(financePermission);

    // Assign a user to the finance group
    const user = await User.findOne({ where: { email: "gaschneider@hotmail.com" } });
    if (user) {
      await user.addGroup(financeGroup);
    }
  }
};
