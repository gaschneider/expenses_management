import express from "express";
import { checkPermission } from "../middlewares/checkPermission";
import { SystemPermission } from "../types/auth";
import {
  getUsers,
  putUserDepartmentPermissionsById,
  putUserSystemPermissionsById
} from "../controllers/userController";

const router = express.Router();

router.get(
  "/",
  checkPermission([
    SystemPermission.MANAGE_USER_SYSTEM_PERMISSIONS,
    SystemPermission.MANAGE_USER_DEPARTMENT_PERMISSIONS,
    SystemPermission.MANAGE_RULES
  ]),
  getUsers
);

router.put(
  "/system-permissions/:id",
  checkPermission(SystemPermission.MANAGE_USER_SYSTEM_PERMISSIONS),
  putUserSystemPermissionsById
);

router.put(
  "/department-permissions/:id",
  checkPermission(SystemPermission.MANAGE_USER_DEPARTMENT_PERMISSIONS),
  putUserDepartmentPermissionsById
);

export default router;
