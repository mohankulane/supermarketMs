import { Router } from "express";
import {
  createReturn,
  deleteReturn,
  getReturns,
  updateReturn,
} from "../controllers/return.controller.js";

const router = Router();

router.get("/", getReturns);
router.post("/", createReturn);
router.patch("/:id", updateReturn);
router.delete("/:id", deleteReturn);

export default router;
