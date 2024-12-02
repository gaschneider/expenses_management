// middleware/checkPermission.ts
import { Request, Response, NextFunction } from "express";
import User from "../models/User";
import { SystemPermission, UserInstance } from "../types/auth";

type PermissionAndDepartmentId = {
  permission: string;
  departmentId?: number;
};

const convertToPermissionAndDepartment = (
  requiredPermissions: string | string[] | PermissionAndDepartmentId[],
  departmentId?: number
) => {
  let permissions: PermissionAndDepartmentId[];

  if (typeof requiredPermissions === "string") {
    // If it's a single string, create an array with one PermissionAndDepartmentId object
    permissions = [
      {
        permission: requiredPermissions,
        departmentId: departmentId // optional departmentId
      }
    ];
  } else if (Array.isArray(requiredPermissions) && typeof requiredPermissions[0] === "string") {
    // If it's an array of strings, map them to PermissionAndDepartmentId
    permissions = requiredPermissions.map((permission) => ({
      permission: permission as string,
      departmentId: departmentId // optional departmentId
    }));
  } else {
    // If it's already an array of PermissionAndDepartmentId, just use it as is
    permissions = requiredPermissions as PermissionAndDepartmentId[];
  }

  return permissions;
};

// required permission works as OR, if wanna check multiple permissions as AND, chain in the route middleware
export const checkPermission = (
  requiredPermissions: string | string[] | PermissionAndDepartmentId[],
  departmentId?: number
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      // Find user with groups and permissions
      const user = await User.findByPk(req.user.id);

      if (!user) {
        res.status(401).json({ error: "User not found" });
        return;
      }

      if (await user.hasPermissionString(SystemPermission.ADMIN)) {
        next();
        return;
      }

      const innerRequiredPermissions = convertToPermissionAndDepartment(
        requiredPermissions,
        departmentId
      );

      for (let index = 0; index < innerRequiredPermissions.length; index++) {
        let hasPermission = false;
        const { permission: elPermission, departmentId: elDepartmentId } =
          innerRequiredPermissions[index];

        // Check if user has the required permission
        if (elDepartmentId) {
          hasPermission = await user.hasDepartmentPermissionString(elDepartmentId, elPermission);
        } else {
          hasPermission = await user.hasPermissionString(elPermission);
        }

        if (hasPermission) {
          next();
          return;
        }
      }

      res.status(403).json({ error: "Insufficient permissions" });
      return;
    } catch (error) {
      console.error("Permission check error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };
};

// Helper function to check permissions programmatically
export const userHasPermission = async (
  user: UserInstance,
  permission: string,
  departmentId?: number
): Promise<boolean> => {
  const userRecord = await User.findByPk(user.id);

  if (!userRecord) {
    return false;
  }

  if (await userRecord.hasPermissionString(SystemPermission.ADMIN)) {
    return true;
  }

  // Check if user has the required permission
  if (departmentId) {
    return await userRecord.hasDepartmentPermissionString(departmentId, permission);
  }

  return await userRecord.hasPermissionString(permission);
};
