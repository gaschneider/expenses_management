import express from "express";
import { checkPermission } from "../middlewares/checkPermission";
import { SystemPermission } from "../types/auth";
import {
  createRule,
  deleteRule,
  editRule,
  getRuleById,
  getRules
} from "../controllers/ruleController";

const router = express.Router();

router.post("/", checkPermission(SystemPermission.MANAGE_RULES), createRule);

router.get("/", checkPermission(SystemPermission.MANAGE_RULES), getRules);

router.get("/:id", checkPermission(SystemPermission.MANAGE_RULES), getRuleById);

router.patch("/:id", checkPermission(SystemPermission.MANAGE_RULES), editRule);

router.delete("/:id", checkPermission(SystemPermission.MANAGE_RULES), deleteRule);

export default router;