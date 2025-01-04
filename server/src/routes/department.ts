import express from "express";
import {
  createDepartment,
  getDepartments,
  editDepartment,
  deleteDepartment,
  getDepartmentById,
  getApproversByDepartmentId,
  getCategoriesByDepartmentId,
  getCreateExpenseDepartmentsByUser,
  getExpenseDepartmentsByUser
} from "../controllers/departmentController";
import { checkPermission, checkPermissionDepartment } from "../middlewares/checkPermission";
import { DepartmentPermission, SystemPermission } from "../types/auth";

const router = express.Router();

router.post("/", checkPermission(SystemPermission.CREATE_DEPARTMENT), createDepartment);

router.get(
  "/",
  checkPermission([
    SystemPermission.CREATE_DEPARTMENT,
    SystemPermission.EDIT_DEPARTMENT,
    SystemPermission.DELETE_DEPARTMENT,
    SystemPermission.MANAGE_USER_SYSTEM_PERMISSIONS,
    SystemPermission.MANAGE_USER_DEPARTMENT_PERMISSIONS,
    SystemPermission.MANAGE_RULES
  ]),
  getDepartments
);

router.get("/create-expense-departments", getCreateExpenseDepartmentsByUser);

router.get("/view-expenses-departments", getExpenseDepartmentsByUser);

router.get(
  "/:id",
  checkPermission([
    SystemPermission.CREATE_DEPARTMENT,
    SystemPermission.EDIT_DEPARTMENT,
    SystemPermission.DELETE_DEPARTMENT
  ]),
  getDepartmentById
);

router.get(
  "/:id/approvers",
  checkPermission([SystemPermission.MANAGE_RULES]),
  getApproversByDepartmentId
);

router.get(
  "/:id/categories",
  checkPermissionDepartment(
    [
      DepartmentPermission.VIEW_EXPENSES,
      DepartmentPermission.APPROVE_EXPENSES,
      DepartmentPermission.CREATE_EXPENSES
    ],
    "id"
  ),
  getCategoriesByDepartmentId
);

router.patch("/:id", checkPermission(SystemPermission.EDIT_DEPARTMENT), editDepartment);

router.delete("/:id", checkPermission(SystemPermission.DELETE_DEPARTMENT), deleteDepartment);

export default router;
