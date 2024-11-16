'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Create Users table first since it's referenced by other tables
    await queryInterface.createTable('Users', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      firstName: {
        type: Sequelize.STRING,
        allowNull: false
      },
      lastName: {
        type: Sequelize.STRING,
        allowNull: false
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
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

    // Create UserPermissions table
    await queryInterface.createTable('UserPermissions', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      permissions: {
        type: Sequelize.TEXT,
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

    // Add index to UserPermissions
    await queryInterface.addIndex('UserPermissions', {
      fields: ['userId'],
      unique: true,
      name: 'user_unique'
    });

    // Create Departments table
    await queryInterface.createTable('Departments', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
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

    // Create UserDepartmentPermissions table
    await queryInterface.createTable('UserDepartmentPermissions', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      departmentId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Departments',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      permissions: {
        type: Sequelize.TEXT,
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

    // Add index to UserDepartmentPermissions
    await queryInterface.addIndex('UserDepartmentPermissions', {
      fields: ['userId', 'departmentId'],
      unique: true,
      name: 'user_department_unique'
    });

    // Create Expenses table
    await queryInterface.createTable('Expenses', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      category: {
        type: Sequelize.STRING,
        allowNull: false,
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
          model: 'Departments',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
        comment: "Requesting department"
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
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
        comment: "ID of the requesting employee"
      },
      projectId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: "Associated project ID"
      },
      costCenter: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: "Cost center (e.g., marketing, technology)"
      },
      currency: {
        type: Sequelize.ENUM('BRL', 'USD', 'EUR'),
        allowNull: false,
        defaultValue: 'BRL',
        comment: "Expense currency"
      },
      paymentDate: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: "Expense payment date"
      },
      currentStatus: {
        type: Sequelize.ENUM(
          'DRAFT',
          'PENDING_APPROVAL',
          'APPROVED',
          'REJECTED',
          'CANCELLED',
          'PROCESSING_PAYMENT',
          'PAID'
        ),
        allowNull: false,
        defaultValue: 'DRAFT',
        comment: "Current status of the expense"
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

    // Create ExpenseStatuses table
    await queryInterface.createTable('ExpenseStatuses', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      expenseId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Expenses',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        comment: "Reference to the expense"
      },
      status: {
        type: Sequelize.ENUM(
          'DRAFT',
          'PENDING_APPROVAL',
          'APPROVED',
          'REJECTED',
          'CANCELLED',
          'PROCESSING_PAYMENT',
          'PAID'
        ),
        allowNull: false,
        comment: "Status of the expense at this step"
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
        comment: "User who made the status change"
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
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: "Next user in the approval flow"
      },
      dueDate: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: "Due date for the current status (if applicable)"
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

  async down(queryInterface, Sequelize) {
    // Drop tables in reverse order to handle foreign key constraints
    await queryInterface.dropTable('ExpenseStatuses');
    await queryInterface.dropTable('Expenses');
    await queryInterface.dropTable('UserDepartmentPermissions');
    await queryInterface.dropTable('Departments');
    await queryInterface.dropTable('UserPermissions');
    await queryInterface.dropTable('Users');

    // Drop ENUMs
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS enum_Expenses_currency;');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS enum_Expenses_currentStatus;');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS enum_ExpenseStatuses_status;');
  }
};