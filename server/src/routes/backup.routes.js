import { Router } from "express";
import {
  getBackup,
  restoreBackupData,
} from "../controllers/backup.controller.js";

const router = Router();

router.get("/", getBackup);
router.post("/restore", restoreBackupData);

export default router;
