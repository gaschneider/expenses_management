import { Model, DataTypes } from "sequelize";
import sequelize from "../config/database";
import { AuditAction, PermissionAuditLogAttributes } from "../types/auth";

class PermissionAuditLog extends Model<PermissionAuditLogAttributes, PermissionAuditLogAttributes> {
  declare id?: number;
  declare targetUserId: number; // User whose permissions were changed
  declare performedByUserId: number; // User who made the change
  declare action: AuditAction;
  declare entityType: string; // 'UserPermission' or 'UserDepartmentPermission'
  declare entityId: number;
  declare departmentId?: number;
  declare oldPermissions?: string;
  declare newPermissions: string;
  declare timestamp: Date;
  declare ipAddress?: string;
  declare userAgent?: string;
}

PermissionAuditLog.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    targetUserId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "Users",
        key: "id"
      }
    },
    performedByUserId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "Users",
        key: "id"
      }
    },
    action: {
      type: DataTypes.ENUM(...Object.values(AuditAction)),
      allowNull: false
    },
    entityType: {
      type: DataTypes.STRING,
      allowNull: false
    },
    entityId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    departmentId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "Departments",
        key: "id"
      }
    },
    oldPermissions: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    newPermissions: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    timestamp: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    ipAddress: {
      type: DataTypes.STRING,
      allowNull: true
    },
    userAgent: {
      type: DataTypes.STRING,
      allowNull: true
    }
  },
  {
    sequelize,
    modelName: "PermissionAuditLog",
    tableName: "PermissionAuditLogs",
    timestamps: false,
    indexes: [
      {
        fields: ["targetUserId"]
      },
      {
        fields: ["performedByUserId"]
      },
      {
        fields: ["timestamp"]
      },
      {
        fields: ["entityType", "entityId"]
      }
    ]
  }
);

export default PermissionAuditLog;
