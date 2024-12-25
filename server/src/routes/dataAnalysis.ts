import express from "express";
import {
    getExpensesStatusCount,
    getExpensesAmountByStatus,
    getExpensesByMonth,
    getGlobalMetrics,
    getCountExpensesByCategoryAndStatus,
    getAmountExpensesByCategoryAndStatus,
    getTotalExpensesByCategory
} from "../controllers/dataAnalysisController";
import { checkPermission } from "../middlewares/checkPermission";
import { SystemPermission } from "../types/auth";

const router = express.Router();

router.get(
  "/statuses_count",
  checkPermission([
    SystemPermission.VIEW_DATA_ANALYSIS
  ]),
  getExpensesStatusCount
);

router.get(
  "/statuses_amount",
  checkPermission([
    SystemPermission.VIEW_DATA_ANALYSIS
  ]),
  getExpensesAmountByStatus
);

router.get(
  "/amount_month",
  checkPermission([
    SystemPermission.VIEW_DATA_ANALYSIS
  ]),
  getExpensesByMonth
);

router.get(
  "/summary",
  checkPermission([
    SystemPermission.VIEW_DATA_ANALYSIS
  ]),
  getGlobalMetrics
);

router.get(
  "/total_expenses_category_status",
  checkPermission([
    SystemPermission.VIEW_DATA_ANALYSIS
  ]),
  getCountExpensesByCategoryAndStatus
);

router.get(
  "/amount_expenses_category_status",
  checkPermission([
    SystemPermission.VIEW_DATA_ANALYSIS
  ]),
  getAmountExpensesByCategoryAndStatus
);

router.get(
  "/amount_expenses_category",
  checkPermission([
    SystemPermission.VIEW_DATA_ANALYSIS
  ]),
  getTotalExpensesByCategory
);

export default router;
