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
  "/:departmentId/approve/:id",
  checkPermissionDepartment(DepartmentPermission.APPROVE_EXPENSES),
  expenseController.approveExpense
);

router.put(
  "/:departmentId/reject/:id",
  checkPermissionDepartment(DepartmentPermission.APPROVE_EXPENSES),
  expenseController.rejectExpense
);

router.put(
  "/:departmentId/cancel/:id",
  checkPermissionDepartment(DepartmentPermission.CREATE_EXPENSES),
  expenseController.cancelExpense
);

router.put(
  "/:departmentId/draft/:id",
  checkPermissionDepartment(DepartmentPermission.CREATE_EXPENSES),
  expenseController.setAsDraftExpense
);

router.put(
  "/:departmentId/publish/:id",
  checkPermissionDepartment(DepartmentPermission.CREATE_EXPENSES),
  expenseController.publishExpense
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
