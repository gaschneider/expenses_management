import { Request, Response, NextFunction } from "express";
import User from "../models/User";
import {
  updateUserDepartmentPermissions,
  updateUserPermissions
} from "../services/permissionAuditService";
import {
  userToWithPermissionsDTO,
  UserWithPermissionsDTO
} from "../helpers/userToWithPermissionsDTO";
import UserDepartmentPermission from "../models/UserDepartmentPermission";

export const putUserSystemPermissionsById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
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

    const user = await User.findByPk(id);

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const { systemPermissions } = req.body as UserWithPermissionsDTO;

    if (!systemPermissions) {
      await updateUserPermissions(req, user.id!, "", true);
    } else {
      await updateUserPermissions(req, user.id!, systemPermissions.join(","));
    }

    res.status(200).json({
      message: "System permissions updated successfully"
    });
  } catch (error) {
    next(error);
  }
};

export const putUserDepartmentPermissionsById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
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

    const { departments } = req.body as UserWithPermissionsDTO;

    const user = await User.findByPk(id);

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const newUserDepartments = new Map<number, string[]>();

    departments.forEach((d) => {
      newUserDepartments.set(d.departmentId, d.permissions);
    });

    const existingUserDepartments = await user.getDepartments();
    const updatePromises: Promise<UserDepartmentPermission | null | undefined>[] = [];
    existingUserDepartments.forEach((ud) => {
      if (!ud.id) return;

      const newUserDepartmentPermissions = newUserDepartments.get(ud.id);
      if (newUserDepartmentPermissions) {
        updatePromises.push(
          updateUserDepartmentPermissions(
            req,
            user.id!,
            ud.id,
            newUserDepartmentPermissions.join(",")
          )
        );
        newUserDepartments.delete(ud.id);
      } else {
        updatePromises.push(updateUserDepartmentPermissions(req, user.id!, ud.id, "", true));
      }
    });

    newUserDepartments.entries().forEach(([dId, dPermissions]) => {
      updatePromises.push(
        updateUserDepartmentPermissions(req, user.id!, dId, dPermissions.join(","))
      );
    });

    await Promise.all(updatePromises);

    res.status(200).json({
      message: "Department permissions updated successfully"
    });
  } catch (error) {
    next(error);
  }
};

export const getUsers = async (req: Request, res: Response) => {
  const users = await User.findAll();

  const usersDTOPromises = users.map(userToWithPermissionsDTO);

  const usersDTO = await Promise.all(usersDTOPromises);

  res.status(200).json(usersDTO);
};
