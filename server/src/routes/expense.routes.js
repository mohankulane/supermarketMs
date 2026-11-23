import { Router } from "express";
import {
  requireAnyPermission,
  requirePermission,
} from "../middleware/auth.middleware.js";
import {
  createExpense,
  deleteExpense,
  getExpenses,
  updateExpense,
} from "../controllers/expense.controller.js";

const router = Router();

router.get(
  "/",
  requireAnyPermission("expenses:view", "reports:view", "dashboard:view"),
  getExpenses,
);
router.post("/", requirePermission("expenses:manage"), createExpense);
router.patch("/:id", requirePermission("expenses:manage"), updateExpense);
router.delete("/:id", requirePermission("expenses:manage"), deleteExpense);

export default router;
