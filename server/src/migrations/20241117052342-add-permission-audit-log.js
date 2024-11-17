"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("permission_audit_logs", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      targetUserId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        field: "target_user_id",
        references: {
          model: "users",
          key: "id"
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT"
      },
      performedByUserId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        field: "performed_by_user_id",
        references: {
          model: "users",
          key: "id"
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT"
      },
      action: {
        type: Sequelize.ENUM("GRANT", "REVOKE", "MODIFY"),
        allowNull: false
      },
      entityType: {
        type: Sequelize.ENUM("UserPermission", "UserDepartmentPermission"),
        allowNull: false,
        field: "entity_type"
      },
      entityId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        field: "entity_id"
      },
      departmentId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        field: "department_id",
        references: {
          model: "departments",
          key: "id"
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT"
      },
      oldPermissions: {
        type: Sequelize.STRING,
        allowNull: true,
        field: "old_permissions"
      },
      newPermissions: {
        type: Sequelize.STRING,
        allowNull: false,
        field: "new_permissions"
      },
      timestamp: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP")
      },
      ipAddress: {
        type: Sequelize.STRING,
        allowNull: true,
        field: "ip_address"
      },
      userAgent: {
        type: Sequelize.STRING,
        allowNull: true,
        field: "user_agent"
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        field: "created_at",
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP")
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        field: "updated_at",
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP")
      }
    });

    // Add indexes
    await queryInterface.addIndex("permission_audit_logs", ["target_user_id"]);
    await queryInterface.addIndex("permission_audit_logs", ["performed_by_user_id"]);
    await queryInterface.addIndex("permission_audit_logs", ["department_id"]);
    await queryInterface.addIndex("permission_audit_logs", ["timestamp"]);
    await queryInterface.addIndex("permission_audit_logs", ["entity_type", "entity_id"]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("permission_audit_logs");
  }
};
