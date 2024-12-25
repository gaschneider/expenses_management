import express from "express";
import {
    getExpensesStatusCount,
    getExpensesAmountByStatus,
    getExpensesByMonth,
    getGlobalMetrics
} from "../controllers/DataAnalysisController";
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

export default router;
