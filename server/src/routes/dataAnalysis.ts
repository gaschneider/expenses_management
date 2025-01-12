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

const router = express.Router();

router.get(
  "/statuses-count",
  getExpensesStatusCount
);

router.get(
  "/statuses-amount",
  getExpensesAmountByStatus
);

router.get(
  "/amount-month",
  getExpensesByMonth
);

router.get(
  "/summary",
  getGlobalMetrics
);

router.get(
  "/total-expenses-category-status",
  getCountExpensesByCategoryAndStatus
);

router.get(
  "/amount-expenses-category-status",
  getAmountExpensesByCategoryAndStatus
);

router.get(
  "/amount-expenses-category",
  getTotalExpensesByCategory
);

export default router;
