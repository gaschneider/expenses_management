"use strict";

import { DataTypes } from "sequelize";

module.exports = {
  async up(queryInterface) {
    await queryInterface.createTable("Categories", {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      departmentId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "Departments",
          key: "id"
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL"
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      }
    });

    // Add unique index for departmentId and name
    await queryInterface.addIndex("Categories", {
      fields: ["departmentId", "name"],
      unique: true,
      name: "unique_department_category_name"
    });
  },

  async down(queryInterface) {
    // Remove the unique index first
    await queryInterface.removeIndex("Categories", "unique_department_category_name");

    // Drop the table
    await queryInterface.dropTable("Categories");
  }
};
