import asyncHandler from "../middleware/asyncHandler.js";
import { getDashboard } from "../services/dashboard.service.js";

export const getDashboardData = asyncHandler(async (_req, res) =>
  res.json(await getDashboard()),
);
