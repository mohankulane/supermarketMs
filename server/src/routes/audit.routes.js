import { Router } from "express";
import { requirePermission } from "../middleware/auth.middleware.js";
import { getAuditLogs } from "../controllers/audit.controller.js";

const router = Router();

router.get("/", requirePermission("audit:view"), getAuditLogs);

export default router;
