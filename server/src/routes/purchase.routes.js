import { Router } from "express";
import {
  requireAnyPermission,
  requirePermission,
} from "../middleware/auth.middleware.js";
import {
  createPurchase,
  deletePurchase,
  getPurchases,
  recordPurchasePayment,
  updatePurchase,
} from "../controllers/purchase.controller.js";

const router = Router();

router.get(
  "/",
  requireAnyPermission("purchases:view", "reports:view"),
  getPurchases,
);
router.post("/", requirePermission("purchases:manage"), createPurchase);
router.post(
  "/:id/payments",
  requirePermission("purchases:manage"),
  recordPurchasePayment,
);
router.patch("/:id", requirePermission("purchases:manage"), updatePurchase);
router.patch(
  "/:id/status",
  requirePermission("purchases:manage"),
  updatePurchase,
);
router.delete("/:id", requirePermission("purchases:manage"), deletePurchase);

export default router;
