import { Request, Response, NextFunction } from "express";
import Department from "../models/Department";
import User from "../models/User";
import {
  updateUserDepartmentPermissions,
  updateUserPermissions
} from "../services/permissionAuditService";

type UserDTO = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  systemPermissions: string[];
  departments: {
    departmentId: number;
    departmentName: string;
    permissions: string[];
  }[];
};

const userToDTO = async (user: User) => {
  const departmentsByUser = await user.getDepartments();
  const userDepartmentPermissionsPromises = departmentsByUser.map(async (d: Department) => ({
    departmentId: d.id!,
    departmentName: d.name,
    permissions: await d.getUserPermissionStrings(user.id!)
  }));

  const userDepartmentPermissions = await Promise.all(userDepartmentPermissionsPromises);

  return {
    id: user.id!,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    systemPermissions: await user.getUserPermissionStrings(),
    departments: userDepartmentPermissions
  } as UserDTO;
};

export const putUserById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Authenticated user not found" });
      return;
    }

    const { id } = req.params;

    if (id == null || typeof id != "string" || !Number.isFinite(Number(id))) {
      res.status(400).json({ error: "Invalid user id" });
      return;
    }

    const { systemPermissions, departments } = req.body as UserDTO;

    const user = await User.findByPk(id);

    if (!user) {
      res.status(401).json({ error: "User not found" });
      return;
    }

    if (!systemPermissions) {
      updateUserPermissions(req, user.id!, "", true);
    } else {
      updateUserPermissions(req, user.id!, systemPermissions.join(","), true);
    }

    const newUserDepartments = new Map<number, string[]>();

    departments.forEach((d) => {
      newUserDepartments.set(d.departmentId, d.permissions);
    });

    const existingUserDepartments = await user.getDepartments();
    existingUserDepartments.forEach((ud) => {
      if (!ud.id) return;

      const newUserDepartmentPermissions = newUserDepartments.get(ud.id);
      if (newUserDepartmentPermissions) {
        updateUserDepartmentPermissions(
          req,
          user.id!,
          ud.id,
          newUserDepartmentPermissions.join(",")
        );
        newUserDepartments.delete(ud.id);
      } else {
        updateUserDepartmentPermissions(req, user.id!, ud.id, "", true);
      }
    });

    newUserDepartments.entries().forEach(([dId, dPermissions]) => {
      updateUserDepartmentPermissions(req, user.id!, dId, dPermissions.join(","));
    });

    res.status(200).json({
      message: "Permissions updated successfully"
    });
  } catch (error) {
    next(error);
  }
};

export const getUsers = async (req: Request, res: Response) => {
  const users = await User.findAll();

  const usersDTOPromises = users.map(userToDTO);

  const usersDTO = await Promise.all(usersDTOPromises);

  res.status(200).json(usersDTO);
};
