import express from "express";
import { checkPermissionDepartment } from "../middlewares/checkPermission";
import { DepartmentPermission } from "../types/auth";
import {
    getExpensesStatusCount,
    getExpensesAmountByStatus,
    getExpensesByMonth,
    getGlobalMetrics,
    getCountExpensesByCategoryAndStatus,
    getAmountExpensesByCategoryAndStatus,
    getTotalExpensesByCategory
} from "../controllers/dataAnalysisController";

const router = express.Router();

router.get(
  "/statuses_count",
  getExpensesStatusCount
);

router.get(
  "/statuses_amount",
  getExpensesAmountByStatus
);

router.get(
  "/amount_month",
  getExpensesByMonth
);

router.get(
  "/summary",
  getGlobalMetrics
);

router.get(
  "/total_expenses_category_status",
  getCountExpensesByCategoryAndStatus
);

router.get(
  "/amount_expenses_category_status",
  getAmountExpensesByCategoryAndStatus
);

router.get(
  "/amount_expenses_category",
  getTotalExpensesByCategory
);

export default router;
