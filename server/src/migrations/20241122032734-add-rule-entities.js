"use strict";

/** @type {import('sequelize-cli').Migration} */

module.exports = {
  up: async (queryInterface) => {
    // Create Rules table
    await queryInterface.createTable("Rules", {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      departmentId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "Departments",
          key: "id"
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      minValue: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
      },
      maxValue: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
      },
      canBeSingleApproved: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false
      }
    });

    // Add index on departmentId for better performance
    await queryInterface.addIndex("Rules", ["departmentId"]);

    // Create RuleSteps table
    await queryInterface.createTable("RuleSteps", {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      ruleId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "Rules",
          key: "id"
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      step: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      approvingDepartmentId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "Departments",
          key: "id"
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      approvingUserId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "Users",
          key: "id"
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false
      }
    });

    // Add unique constraint for ruleId and step combination
    await queryInterface.addIndex("RuleSteps", ["ruleId", "step"], {
      unique: true
    });

    // Add indexes for foreign keys
    await queryInterface.addIndex("RuleSteps", ["approvingDepartmentId"]);
    await queryInterface.addIndex("RuleSteps", ["approvingUserId"]);

    // Add check constraint to ensure either approvingDepartmentId or approvingUserId is set (not both)
    await queryInterface.sequelize.query(`
      ALTER TABLE RuleSteps
      ADD CONSTRAINT check_exclusive_approver
      CHECK (
        (approvingDepartmentId IS NULL AND approvingUserId IS NOT NULL) OR
        (approvingDepartmentId IS NOT NULL AND approvingUserId IS NULL)
      )
    `);
  },

  down: async (queryInterface) => {
    // Drop tables in reverse order to avoid foreign key constraints
    await queryInterface.sequelize.query(`
      ALTER TABLE RuleSteps
      DROP CONSTRAINT IF EXISTS check_exclusive_approver
    `);

    await queryInterface.dropTable("RuleSteps");
    await queryInterface.dropTable("Rules");
  }
};
