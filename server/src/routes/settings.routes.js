import { Router } from "express";
import {
  requireAnyPermission,
  requirePermission,
  requireRole,
} from "../middleware/auth.middleware.js";
import {
  createPaymentMethod,
  createTeamMember,
  deletePaymentMethod,
  deleteTeamMember,
  getSettings,
  updatePaymentMethod,
  updateStoreSettings,
  updateTeamMember,
} from "../controllers/settings.controller.js";

const router = Router();

router.get(
  "/",
  requireAnyPermission("settings:manage", "sales:use"),
  getSettings,
);
router.patch("/", requirePermission("settings:manage"), updateStoreSettings);
router.post(
  "/payment-methods",
  requirePermission("settings:manage"),
  createPaymentMethod,
);
router.patch(
  "/payment-methods/:id",
  requirePermission("settings:manage"),
  updatePaymentMethod,
);
router.delete(
  "/payment-methods/:id",
  requirePermission("settings:manage"),
  deletePaymentMethod,
);
router.get("/users", requireRole("Owner"), getSettings);
router.post("/users", requireRole("Owner"), createTeamMember);
router.patch("/users/:id", requireRole("Owner"), updateTeamMember);
router.delete("/users/:id", requireRole("Owner"), deleteTeamMember);

export default router;
