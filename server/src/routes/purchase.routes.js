import { Router } from "express";
import {
  createPurchase,
  deletePurchase,
  getPurchases,
  updatePurchase,
} from "../controllers/purchase.controller.js";

const router = Router();

router.get("/", getPurchases);
router.post("/", createPurchase);
router.patch("/:id", updatePurchase);
router.patch("/:id/status", updatePurchase);
router.delete("/:id", deletePurchase);

export default router;
