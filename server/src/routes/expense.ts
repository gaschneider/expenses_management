import express from "express";
import { checkPermissionDepartment } from "../middlewares/checkPermission";
import { DepartmentPermission } from "../types/auth";
import { validateRequest } from "../middlewares/validateRequest";
import { expenseDtoSchema } from "../validation-schemas/expense.schema";
import { ExpenseController } from "../controllers/expenseController";

const router = express.Router();
const expenseController = new ExpenseController();

router.post(
  "/:departmentId",
  checkPermissionDepartment(DepartmentPermission.CREATE_EXPENSES),
  validateRequest(expenseDtoSchema),
  expenseController.createExpense
);

router.put(
  "/approve/:departmentId/:id",
  checkPermissionDepartment(DepartmentPermission.APPROVE_EXPENSES),
  expenseController.approveExpense
);

router.put(
  "/reject/:departmentId/:id",
  checkPermissionDepartment(DepartmentPermission.APPROVE_EXPENSES),
  expenseController.rejectExpense
);

router.get("/", expenseController.listExpenses);

router.get("/:id", expenseController.getExpenseById);

// router.put(
//   "/:id",
//   checkPermission(SystemPermission.MANAGE_RULES),
//   validateRequest(editRuleSchema),
//   editRule
// );

// router.delete("/:id", checkPermission(SystemPermission.MANAGE_RULES), deleteRule);

export default router;
