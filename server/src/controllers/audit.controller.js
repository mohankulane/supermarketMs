import asyncHandler from "../middleware/asyncHandler.js";
import { findAuditLogs } from "../services/audit.service.js";

export const getAuditLogs = asyncHandler(async (_req, res) =>
  res.json(await findAuditLogs()),
);
