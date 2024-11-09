export default {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert("Groups", [
      {
        name: "Admin",
        description: "System administrators",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: "User",
        description: "Regular users",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: "Finance",
        description: "Finance team members",
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete("Groups", null, {});
  }
};
