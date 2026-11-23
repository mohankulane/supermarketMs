import { Router } from "express";
import { requireRole } from "../middleware/auth.middleware.js";
import {
  getBackup,
  restoreBackupData,
} from "../controllers/backup.controller.js";

const router = Router();

router.get("/", requireRole("Owner"), getBackup);
router.post("/restore", requireRole("Owner"), restoreBackupData);

export default router;
