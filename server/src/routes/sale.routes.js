import { Router } from "express";
import {
  createSale,
  deleteSale,
  getSales,
  updateSale,
} from "../controllers/sale.controller.js";

const router = Router();

router.get("/", getSales);
router.post("/", createSale);
router.patch("/:id", updateSale);
router.delete("/:id", deleteSale);

export default router;
