import express from "express";
import { checkPermissionDepartment } from "../middlewares/checkPermission";
import { DepartmentPermission } from "../types/auth";
import { validateRequest } from "../middlewares/validateRequest";
import { expenseDtoSchema, expenseUpdateDtoSchema } from "../validation-schemas/expense.schema";
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
  "/:departmentId/request-info/:id",
  checkPermissionDepartment(DepartmentPermission.APPROVE_EXPENSES),
  expenseController.requestInfoExpense
);

router.put(
  "/:departmentId/update/:id",
  checkPermissionDepartment(DepartmentPermission.CREATE_EXPENSES),
  validateRequest(expenseUpdateDtoSchema),
  expenseController.updateExpense
);

router.get("/", expenseController.listExpenses);

router.get("/:id", expenseController.getExpenseById);

export default router;
