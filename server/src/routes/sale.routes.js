import { Router } from "express";
import {
  requireAnyPermission,
  requirePermission,
} from "../middleware/auth.middleware.js";
import {
  createSale,
  deleteSale,
  getSales,
  updateSale,
} from "../controllers/sale.controller.js";

const router = Router();

router.get(
  "/",
  requireAnyPermission(
    "invoices:view",
    "returns:view",
    "reports:view",
    "dashboard:view",
  ),
  getSales,
);
router.post("/", requirePermission("sales:use"), createSale);
router.patch("/:id", requirePermission("reports:manage"), updateSale);
router.delete("/:id", requirePermission("reports:manage"), deleteSale);

export default router;
