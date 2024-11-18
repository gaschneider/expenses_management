import { Op, Transaction } from "sequelize";
import { AuditAction } from "../types/auth";
import PermissionAuditLog from "../models/PermissionAuditLog";
import Department from "../models/Department";
import User from "../models/User";
import sequelize from "../config/database";
import UserDepartmentPermission from "../models/UserDepartmentPermission";
import { Request, Response } from "express";
import UserPermission from "../models/UserPermission";

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
        { model: User, as: "targetUser", attributes: ["firstName", "lastName", "email"] },
        { model: User, as: "performedByUser", attributes: ["firstName", "lastName", "email"] },
        { model: Department, as: "department", attributes: ["name"], required: false }
      ]
    });
  }
}

export const updateUserDepartmentPermissions = async (
  req: Request,
  userId: number,
  departmentId: number,
  permissions: string,
  deleting = false
) => {
  if (!req.user?.id) return;
  const transaction = await sequelize.transaction();

  try {
    const userDeptPerm = await UserDepartmentPermission.findOne({
      where: { userId, departmentId },
      transaction
    });

    const oldPermissions = userDeptPerm?.permissions;

    if (deleting && userDeptPerm) {
      await UserDepartmentPermission.destroy({ where: { id: userDeptPerm.id } });

      await PermissionAuditService.logPermissionChange(
        userId,
        AuditAction.REVOKE,
        "UserDepartmentPermission",
        userDeptPerm.id,
        "",
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
      return null;
    }

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
    return permission;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

export const updateUserPermissions = async (
  req: Request,
  userId: number,
  permissions: string,
  deleting = false
) => {
  if (!req.user?.id) return;
  const transaction = await sequelize.transaction();

  try {
    const userPerm = await UserPermission.findOne({
      where: { userId },
      transaction
    });

    const oldPermissions = userPerm?.permissions;

    if (deleting && userPerm) {
      await UserPermission.destroy({ where: { id: userPerm.id } });

      await PermissionAuditService.logPermissionChange(
        userId,
        AuditAction.REVOKE,
        "UserPermission",
        userPerm.id,
        "",
        {
          performedByUserId: req.user.id,
          ipAddress: req.ip,
          userAgent: req.headers["user-agent"],
          transaction
        },
        oldPermissions
      );

      await transaction.commit();
      return null;
    }

    // Update or create permissions
    const [permission, created] = await UserPermission.upsert(
      {
        userId,
        permissions
      },
      { transaction }
    );

    // Log the change
    await PermissionAuditService.logPermissionChange(
      userId,
      created ? AuditAction.GRANT : AuditAction.MODIFY,
      "UserPermission",
      permission.id,
      permissions,
      {
        performedByUserId: req.user.id,
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
        transaction
      },
      oldPermissions
    );

    await transaction.commit();
    return permission;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};
