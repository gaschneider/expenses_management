"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Create Expenses table
    await queryInterface.createTable("Expenses", {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
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
        onDelete: "RESTRICT",
        comment: "Expense category (e.g., travel, food)"
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
        onDelete: "RESTRICT",
        comment: "Requesting department"
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
        onDelete: "RESTRICT",
        comment: "ID of the requesting employee"
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
        type: Sequelize.ENUM("BRL", "USD", "EUR"), // Adjust based on your CurrencyEnum
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
        type: Sequelize.ENUM("DRAFT", "PENDING", "APPROVED", "REJECTED", "PAID"), // Adjust based on your ExpenseStatusEnum
        allowNull: false,
        defaultValue: "DRAFT",
        comment: "Current status of the expense"
      },
      currentRuleStep: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      nextApproverType: {
        type: Sequelize.ENUM("USER", "DEPARTMENT", "ROLE"), // Adjust based on your NextApproverType
        allowNull: true
      },
      nextApproverId: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      ruleId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "Rules",
          key: "id"
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL"
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP")
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP")
      }
    });

    // Create ExpenseStatuses table
    await queryInterface.createTable("ExpenseStatuses", {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
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
        onDelete: "CASCADE",
        comment: "Reference to the expense"
      },
      status: {
        type: Sequelize.ENUM("DRAFT", "PENDING", "APPROVED", "REJECTED", "PAID"),
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
        onDelete: "RESTRICT",
        comment: "User who made the status change"
      },
      comment: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: "Optional comment for the status change"
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP")
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
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
