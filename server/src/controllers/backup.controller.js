import asyncHandler from "../middleware/asyncHandler.js";
import { createBackup, restoreBackup } from "../services/backup.service.js";

export const getBackup = asyncHandler(async (_req, res) =>
  res.json(await createBackup()),
);

export const restoreBackupData = asyncHandler(async (req, res) => {
  const data = req.body;
  if (!data || !Array.isArray(data.products)) {
    return res.status(400).json({ error: "Invalid backup file" });
  }
  res.json(await restoreBackup(data));
});
