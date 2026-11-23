import { Router } from "express";
import {
  requireAnyPermission,
  requirePermission,
} from "../middleware/auth.middleware.js";
import {
  createReturn,
  deleteReturn,
  getReturns,
  updateReturn,
} from "../controllers/return.controller.js";

const router = Router();

router.get(
  "/",
  requireAnyPermission("returns:view", "invoices:view", "reports:view"),
  getReturns,
);
router.post("/", requirePermission("returns:manage"), createReturn);
router.patch("/:id", requirePermission("returns:manage"), updateReturn);
router.delete("/:id", requirePermission("returns:manage"), deleteReturn);

export default router;
