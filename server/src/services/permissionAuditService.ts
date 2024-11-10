import { Op, Transaction } from "sequelize";
import { AuditAction } from "../types/auth";
import PermissionAuditLog from "../models/PermissionAuditLog";
import Department from "../models/Department";
import User from "../models/User";
import sequelize from "../config/database";
import UserDepartmentPermission from "../models/UserDepartmentPermission";
import { Request, Response } from "express";

interface AuditContext {
  performedByUserId: number;
  ipAddress?: string;
  userAgent?: string;
  transaction?: Transaction;
}

export class PermissionAuditService {
  static async logPermissionChange(
    targetUserId: number,
    action: AuditAction,
    entityType: "UserPermission" | "UserDepartmentPermission",
    entityId: number,
    newPermissions: string,
    context: AuditContext,
    oldPermissions?: string,
    departmentId?: number
  ): Promise<void> {
    await PermissionAuditLog.create(
      {
        targetUserId,
        performedByUserId: context.performedByUserId,
        action,
        entityType,
        entityId,
        departmentId,
        oldPermissions,
        newPermissions,
        timestamp: new Date(),
        ipAddress: context.ipAddress,
        userAgent: context.userAgent
      },
      {
        transaction: context.transaction
      }
    );
  }

  static async getAuditHistory(options: {
    targetUserId?: number;
    performedByUserId?: number;
    departmentId?: number;
    startDate?: Date;
    endDate?: Date;
    entityType?: string;
  }): Promise<PermissionAuditLog[]> {
    const where: any = {};

    if (options.targetUserId) where.targetUserId = options.targetUserId;
    if (options.performedByUserId) where.performedByUserId = options.performedByUserId;
    if (options.departmentId) where.departmentId = options.departmentId;
    if (options.entityType) where.entityType = options.entityType;

    if (options.startDate || options.endDate) {
      where.timestamp = {};
      if (options.startDate) where.timestamp[Op.gte] = options.startDate;
      if (options.endDate) where.timestamp[Op.lte] = options.endDate;
    }

    return PermissionAuditLog.findAll({
      where,
      order: [["timestamp", "DESC"]],
      include: [
        { model: User, as: "targetUser", attributes: ["name", "email"] },
        { model: User, as: "performedByUser", attributes: ["name", "email"] },
        { model: Department, attributes: ["name"], required: false }
      ]
    });
  }
}

// Example usage in a controller:
export const updateUserDepartmentPermissions = async (req: Request, res: Response) => {
  if (!req.user?.id) return;
  const transaction = await sequelize.transaction();

  try {
    const { userId, departmentId, permissions } = req.body;
    const userDeptPerm = await UserDepartmentPermission.findOne({
      where: { userId, departmentId },
      transaction
    });

    const oldPermissions = userDeptPerm?.permissions;

    // Update or create permissions
    const [permission, created] = await UserDepartmentPermission.upsert(
      {
        userId,
        departmentId,
        permissions
      },
      { transaction }
    );

    // Log the change
    await PermissionAuditService.logPermissionChange(
      userId,
      created ? AuditAction.GRANT : AuditAction.MODIFY,
      "UserDepartmentPermission",
      permission.id,
      permissions,
      {
        performedByUserId: req.user.id,
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
        transaction
      },
      oldPermissions,
      departmentId
    );

    await transaction.commit();
    res.json(permission);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};
