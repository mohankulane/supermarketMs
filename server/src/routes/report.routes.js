import { Router } from "express";
import {
  getFinancialReportData,
  getSalesReportData,
} from "../controllers/report.controller.js";

const router = Router();

router.get("/sales", getSalesReportData);
router.get("/financial", getFinancialReportData);

export default router;
