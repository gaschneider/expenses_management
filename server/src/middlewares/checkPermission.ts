// middleware/checkPermission.ts
import { Request, Response, NextFunction } from "express";
import User from "../models/user";
import { UserInstance } from "../types/auth";
import Group from "../models/group";
import Permission from "../models/permission";

// Extend Express Request type to include our User type
interface AuthenticatedRequest extends Request {
  user?: UserInstance;
}

export const checkPermission = (requiredPermission: string) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Find user with groups and permissions
      const user = await User.findByPk(req.user.id, {
        include: [
          {
            model: Group,
            include: [
              {
                model: Permission,
                attributes: ["name"]
              }
            ]
          }
        ]
      });

      if (!user) {
        return res.status(401).json({ error: "User not found" });
      }

      // Check if user has the required permission through any of their groups
      const hasPermission = user.Groups?.some((group) =>
        group.Permissions?.some((permission) => permission.name === requiredPermission)
      );

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
  permission: string
): Promise<boolean> => {
  const userWithGroups = await User.findByPk(user.id, {
    include: [
      {
        model: Group,
        include: [
          {
            model: Permission,
            attributes: ["name"]
          }
        ]
      }
    ]
  });

  return !!userWithGroups?.Groups?.some((group) =>
    group.Permissions?.some((perm) => perm.name === permission)
  );
};
