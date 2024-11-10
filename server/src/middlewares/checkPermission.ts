// middleware/checkPermission.ts
import { Request, Response, NextFunction } from "express";
import User from "../models/User";
import { SystemPermission, UserInstance } from "../types/auth";
import UserPermission from "../models/UserPermission";
import UserDepartmentPermission from "../models/UserDepartmentPermission";
import Department from "../models/Department";

// Extend Express Request type to include our User type
interface AuthenticatedRequest extends Request {
  user?: UserInstance;
}

export const checkPermission = (requiredPermission: string, departmentId?: number) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Find user with groups and permissions
      const user = await User.findByPk(req.user.id, {
        include: [
          {
            model: UserPermission,
            as: "userPermission",
            attributes: ["permissions"]
          },
          {
            model: Department,
            as: "departments",
            through: {
              attributes: ["permissions"]
            },
            attributes: ["id", "name", "description"]
          }
        ]
      });

      if (!user) {
        return res.status(401).json({ error: "User not found" });
      }

      if (await user.hasPermissionString(SystemPermission.ADMIN)) {
        next();
        return;
      }

      let hasPermission = false;
      // Check if user has the required permission
      if (departmentId) {
        hasPermission = await user.hasDepartmentPermissionString(departmentId, requiredPermission);
      } else {
        hasPermission = await user.hasPermissionString(requiredPermission);
      }

      if (!hasPermission) {
        return res.status(403).json({ error: "Insufficient permissions" });
      }

      next();
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
  const userRecord = await User.findByPk(user.id, {
    include: [
      {
        model: UserPermission,
        as: "userPermission",
        attributes: ["permissions"]
      },
      {
        model: Department,
        as: "departments",
        through: {
          attributes: ["permissions"]
        },
        attributes: ["id", "name", "description"]
      }
    ]
  });

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
