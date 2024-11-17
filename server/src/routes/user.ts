import express from "express";
import { checkPermission } from "../middlewares/checkPermission";
import { SystemPermission } from "../types/auth";
import { getUsers, putUserById } from "../controllers/userController";

const router = express.Router();

router.get("/", checkPermission(SystemPermission.MANAGE_USER_DEPARTMENT_PERMISSIONS), getUsers);

router.put(
  "/:id",
  checkPermission(SystemPermission.MANAGE_USER_DEPARTMENT_PERMISSIONS),
  putUserById
);

export default router;
