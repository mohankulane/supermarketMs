import { Router } from "express";
import {
  closeShift,
  deleteShift,
  getShifts,
  openShift,
} from "../controllers/shift.controller.js";

const router = Router();

router.get("/", getShifts);
router.post("/open", openShift);
router.post("/:id/close", closeShift);
router.delete("/:id", deleteShift);

export default router;
