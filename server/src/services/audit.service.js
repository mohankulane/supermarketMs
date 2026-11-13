import Audit from "../models/Audit.model.js";

export const findAuditLogs = () =>
  Audit.find().sort({ createdAt: -1 }).limit(100);
