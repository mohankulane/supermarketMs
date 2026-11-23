import { Router } from "express";
import { requirePermission } from "../middleware/auth.middleware.js";
import {
  getFinancialReportData,
  getSalesReportData,
} from "../controllers/report.controller.js";

const router = Router();

router.get("/sales", requirePermission("reports:view"), getSalesReportData);
router.get(
  "/financial",
  requirePermission("reports:view"),
  getFinancialReportData,
);

export default router;
