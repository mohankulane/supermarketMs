import asyncHandler from "../middleware/asyncHandler.js";
import {
  getFinancialReport,
  getSalesReport,
} from "../services/report.service.js";

export const getSalesReportData = asyncHandler(async (req, res) =>
  res.json(await getSalesReport(req.query.from)),
);

export const getFinancialReportData = asyncHandler(async (_req, res) =>
  res.json(await getFinancialReport()),
);
