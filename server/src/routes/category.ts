import express from "express";
import { checkPermission } from "../middlewares/checkPermission";
import { SystemPermission } from "../types/auth";
import { validateRequest } from "../middlewares/validateRequest";
import { createCategorySchema, editCategorySchema } from "../validation-schemas/category.schema";
import {
  createCategory,
  deleteCategory,
  editCategory,
  getCategories,
  getCategoryById
} from "../controllers/categoryController";

const router = express.Router();

router.post(
  "/",
  checkPermission(SystemPermission.MANAGE_CATEGORIES),
  validateRequest(createCategorySchema),
  createCategory
);

router.get("/", checkPermission(SystemPermission.MANAGE_CATEGORIES), getCategories);

router.get("/:id", checkPermission(SystemPermission.MANAGE_CATEGORIES), getCategoryById);

router.put(
  "/:id",
  checkPermission(SystemPermission.MANAGE_CATEGORIES),
  validateRequest(editCategorySchema),
  editCategory
);

router.delete("/:id", checkPermission(SystemPermission.MANAGE_CATEGORIES), deleteCategory);

export default router;
