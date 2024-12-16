"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Create Expenses table
    await queryInterface.createTable("Expenses", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      categoryId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "Categories",
          key: "id"
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT"
      },
      amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        comment: "Expense amount"
      },
      date: {
        type: Sequelize.DATE,
        allowNull: false,
        comment: "Expense date"
      },
      departmentId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "Departments",
          key: "id"
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT"
      },
      title: {
        type: Sequelize.TEXT,
        allowNull: false,
        comment: "Expense title"
      },
      justification: {
        type: Sequelize.TEXT,
        allowNull: false,
        comment: "Expense justification"
      },
      requesterId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "Users",
          key: "id"
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT"
      },
      projectId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: "Associated project ID"
      },
      costCenter: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: "Cost center (e.g., marketing, technology)"
      },
      currency: {
        type: Sequelize.ENUM("BRL", "USD", "EUR", "GBP", "JPY"), // Replace with actual CurrencyEnum values
        allowNull: false,
        defaultValue: "BRL",
        comment: "Expense currency"
      },
      paymentDate: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: "Expense payment date"
      },
      currentStatus: {
        type: Sequelize.ENUM("DRAFT", "PENDING", "APPROVED", "REJECTED", "PAID"), // Replace with actual ExpenseStatusEnum values
        allowNull: false,
        defaultValue: "DRAFT",
        comment: "Current status of the expense"
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP")
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP")
      }
    });

    // Create ExpenseStatuses table
    await queryInterface.createTable("ExpenseStatuses", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      expenseId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "Expenses",
          key: "id"
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      status: {
        type: Sequelize.ENUM("DRAFT", "PENDING", "APPROVED", "REJECTED", "PAID"), // Replace with actual ExpenseStatusEnum values
        allowNull: false,
        comment: "Status of the expense at this step"
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "Users",
          key: "id"
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT"
      },
      comment: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: "Optional comment for the status change"
      },
      nextApproverId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "Users",
          key: "id"
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL"
      },
      dueDate: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: "Due date for the current status (if applicable)"
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP")
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP")
      }
    });
  },

  async down(queryInterface, Sequelize) {
    // Drop tables in reverse order of creation
    await queryInterface.dropTable("ExpenseStatuses");
    await queryInterface.dropTable("Expenses");
  }
};
