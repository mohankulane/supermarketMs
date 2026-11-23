import { Router } from "express";
import { requirePermission } from "../middleware/auth.middleware.js";
import { getDashboardData } from "../controllers/dashboard.controller.js";

const router = Router();

router.get("/", requirePermission("dashboard:view"), getDashboardData);

export default router;
