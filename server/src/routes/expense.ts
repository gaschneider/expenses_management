import express from "express";
import { checkPermissionDepartment } from "../middlewares/checkPermission";
import { DepartmentPermission } from "../types/auth";
import { validateRequest } from "../middlewares/validateRequest";
import { expenseDtoSchema } from "../validation-schemas/expense.schema";
import { createExpense, listExpenses } from "../controllers/expenseController";

const router = express.Router();

router.post(
  "/:departmentId",
  checkPermissionDepartment(DepartmentPermission.CREATE_EXPENSES),
  validateRequest(expenseDtoSchema),
  createExpense
);

router.get("/", listExpenses);

// router.get("/:id", checkPermission(SystemPermission.MANAGE_RULES), getRuleById);

// router.put(
//   "/:id",
//   checkPermission(SystemPermission.MANAGE_RULES),
//   validateRequest(editRuleSchema),
//   editRule
// );

// router.delete("/:id", checkPermission(SystemPermission.MANAGE_RULES), deleteRule);

export default router;
