export default {
  up: async (queryInterface, Sequelize) => {
    // Get all permissions
    const permissions = await queryInterface.sequelize.query("SELECT id, name from Permissions", {
      type: Sequelize.QueryTypes.SELECT
    });

    // Get all groups
    const groups = await queryInterface.sequelize.query("SELECT id, name from Groups", {
      type: Sequelize.QueryTypes.SELECT
    });

    const adminGroup = groups.find((g) => g.name === "Admin");
    const userGroup = groups.find((g) => g.name === "User");
    const financeGroup = groups.find((g) => g.name === "Finance");

    const groupPermissions = [];

    // Admin gets all permissions
    permissions.forEach((permission) => {
      groupPermissions.push({
        groupId: adminGroup.id,
        permissionId: permission.id
      });
    });

    // User group gets basic permissions
    const userPermissions = permissions.filter((p) => ["VIEW_EXPENSES"].includes(p.name));
    userPermissions.forEach((permission) => {
      groupPermissions.push({
        groupId: userGroup.id,
        permissionId: permission.id
      });
    });

    // Finance group gets expense-related permissions
    const financePermissions = permissions.filter((p) =>
      ["VIEW_EXPENSES", "MANAGE_EXPENSES"].includes(p.name)
    );
    financePermissions.forEach((permission) => {
      groupPermissions.push({
        groupId: financeGroup.id,
        permissionId: permission.id
      });
    });

    return queryInterface.bulkInsert("GroupPermissions", groupPermissions);
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete("GroupPermissions", null, {});
  }
};
