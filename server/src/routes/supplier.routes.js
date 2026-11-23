import { Router } from "express";
import {
  requireAnyPermission,
  requirePermission,
} from "../middleware/auth.middleware.js";
import {
  createSupplier,
  deleteSupplier,
  getSuppliers,
  updateSupplier,
} from "../controllers/supplier.controller.js";

const router = Router();

router.get(
  "/",
  requireAnyPermission("suppliers:view", "purchases:view", "reports:view"),
  getSuppliers,
);
router.post("/", requirePermission("suppliers:manage"), createSupplier);
router.patch("/:id", requirePermission("suppliers:manage"), updateSupplier);
router.delete("/:id", requirePermission("suppliers:manage"), deleteSupplier);

export default router;
