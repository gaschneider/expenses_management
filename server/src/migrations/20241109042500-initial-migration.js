export default {
  up: async (queryInterface, Sequelize) => {
    // Users table
    await queryInterface.createTable("Users", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      email: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: false
      },
      password: {
        type: Sequelize.STRING,
        allowNull: false
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Groups table
    await queryInterface.createTable("Groups", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      name: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: false
      },
      description: {
        type: Sequelize.STRING,
        allowNull: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Permissions table
    await queryInterface.createTable("Permissions", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      name: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: false
      },
      description: {
        type: Sequelize.STRING,
        allowNull: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // UserGroups junction table
    await queryInterface.createTable("UserGroups", {
      userId: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        references: {
          model: "Users",
          key: "id"
        },
        onDelete: "CASCADE"
      },
      groupId: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        references: {
          model: "Groups",
          key: "id"
        },
        onDelete: "CASCADE"
      }
    });

    // GroupPermissions junction table
    await queryInterface.createTable("GroupPermissions", {
      groupId: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        references: {
          model: "Groups",
          key: "id"
        },
        onDelete: "CASCADE"
      },
      permissionId: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        references: {
          model: "Permissions",
          key: "id"
        },
        onDelete: "CASCADE"
      }
    });

    // Expenses table
    await queryInterface.createTable("Expenses", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      description: {
        type: Sequelize.STRING,
        allowNull: false
      },
      amount: {
        type: Sequelize.FLOAT,
        allowNull: false
      },
      date: {
        type: Sequelize.DATE,
        allowNull: false
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });
  },

  down: async (queryInterface) => {
    // Drop tables in reverse order to handle foreign key constraints
    await queryInterface.dropTable("GroupPermissions");
    await queryInterface.dropTable("UserGroups");
    await queryInterface.dropTable("Expenses");
    await queryInterface.dropTable("Permissions");
    await queryInterface.dropTable("Groups");
    await queryInterface.dropTable("Users");
  }
};
