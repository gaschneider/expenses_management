export default {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert("Permissions", [
      {
        name: "CREATE_USER",
        description: "Can create new users",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: "EDIT_USER",
        description: "Can edit existing users",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: "DELETE_USER",
        description: "Can delete users",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: "VIEW_EXPENSES",
        description: "Can view expenses",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: "MANAGE_EXPENSES",
        description: "Can manage expenses",
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete("Permissions", null, {});
  }
};
