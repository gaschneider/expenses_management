import bcrypt from "bcryptjs";

export default {
  up: async (queryInterface, Sequelize) => {
    // Create admin user
    await queryInterface.bulkInsert("Users", [
      {
        email: "admin@example.com",
        password: await bcrypt.hash("admin123", 10),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);

    // Get the created admin user
    const adminUser = await queryInterface.sequelize.query(
      `SELECT id from Users WHERE email = 'admin@example.com'`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    const adminUserId = adminUser[0].id;

    // Get admin group
    const adminGroup = await queryInterface.sequelize.query(
      `SELECT id from Groups WHERE name = 'Admin'`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    const adminGroupId = adminGroup[0].id;

    // Associate admin user with admin group
    await queryInterface.bulkInsert("UserGroups", [
      {
        userId: adminUserId,
        groupId: adminGroupId
      }
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    // First remove from UserGroups
    const adminUser = await queryInterface.sequelize.query(
      `SELECT id from Users WHERE email = 'admin@example.com'`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    if (adminUser[0]) {
      await queryInterface.bulkDelete("UserGroups", { userId: adminUser[0].id });
    }
    // Then remove the user
    return queryInterface.bulkDelete("Users", { email: "admin@example.com" });
  }
};
