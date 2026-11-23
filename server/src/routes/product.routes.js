import { Router } from "express";
import {
  requireAnyPermission,
  requirePermission,
} from "../middleware/auth.middleware.js";
import {
  adjustStock,
  createProduct,
  deleteProduct,
  getProductByBarcode,
  getProduct,
  getProducts,
  updateProduct,
} from "../controllers/product.controller.js";

const router = Router();

router.get(
  "/barcode/:barcode",
  requireAnyPermission(
    "inventory:view",
    "sales:use",
    "returns:view",
    "reports:view",
  ),
  getProductByBarcode,
);
router.get(
  "/:id",
  requireAnyPermission(
    "inventory:view",
    "sales:use",
    "returns:view",
    "reports:view",
  ),
  getProduct,
);
router.get(
  "/",
  requireAnyPermission(
    "inventory:view",
    "sales:use",
    "returns:view",
    "reports:view",
  ),
  getProducts,
);
router.post("/", requirePermission("inventory:manage"), createProduct);
router.patch("/:id", requirePermission("inventory:manage"), updateProduct);
router.delete("/:id", requirePermission("inventory:manage"), deleteProduct);
router.post(
  "/:id/stock",
  requirePermission("inventory:manage"),
  adjustStock,
);

export default router;
