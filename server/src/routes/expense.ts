import express from "express";
import { checkPermission, checkPermissionDepartment } from "../middlewares/checkPermission";
import { DepartmentPermission, SystemPermission } from "../types/auth";
import {
  createRule,
  deleteRule,
  editRule,
  getRuleById,
  getRules
} from "../controllers/ruleController";
import { validateRequest } from "../middlewares/validateRequest";
import { editRuleSchema } from "../validation-schemas/rule.schema";
import { expenseDtoSchema } from "../validation-schemas/expense.schema";
import { createExpense } from "../controllers/expenseController";

const router = express.Router();

router.post(
  "/:departmentId",
  checkPermissionDepartment(DepartmentPermission.CREATE_EXPENSES),
  validateRequest(expenseDtoSchema),
  createExpense
);

// router.get("/", checkPermission(SystemPermission.MANAGE_RULES), getRules);

// router.get("/:id", checkPermission(SystemPermission.MANAGE_RULES), getRuleById);

// router.put(
//   "/:id",
//   checkPermission(SystemPermission.MANAGE_RULES),
//   validateRequest(editRuleSchema),
//   editRule
// );

// router.delete("/:id", checkPermission(SystemPermission.MANAGE_RULES), deleteRule);

// export default router;
