import { Router } from "express";
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

router.get("/barcode/:barcode", getProductByBarcode);
router.get("/:id", getProduct);
router.get("/", getProducts);
router.post("/", createProduct);
router.patch("/:id", updateProduct);
router.delete("/:id", deleteProduct);
router.post("/:id/stock", adjustStock);

export default router;
