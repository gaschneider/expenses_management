import express from "express";
import {
  createDepartment,
  getDepartments,
  editDepartment,
  deleteDepartment,
  getDepartmentById
} from "../controllers/departmentController";
import { checkPermission } from "../middlewares/checkPermission";
import { SystemPermission } from "../types/auth";

const router = express.Router();

router.post("/", checkPermission(SystemPermission.CREATE_DEPARTMENT), createDepartment);

router.get(
  "/",
  checkPermission([
    SystemPermission.CREATE_DEPARTMENT,
    SystemPermission.EDIT_DEPARTMENT,
    SystemPermission.DELETE_DEPARTMENT
  ]),
  getDepartments
);

router.get(
  "/:id",
  checkPermission([
    SystemPermission.CREATE_DEPARTMENT,
    SystemPermission.EDIT_DEPARTMENT,
    SystemPermission.DELETE_DEPARTMENT
  ]),
  getDepartmentById
);

router.patch("/:id", checkPermission(SystemPermission.EDIT_DEPARTMENT), editDepartment);

router.delete("/:id", checkPermission(SystemPermission.DELETE_DEPARTMENT), deleteDepartment);

export default router;
