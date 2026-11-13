import { Router } from "express";
import {
  createBranch,
  createPaymentMethod,
  createTeamMember,
  deleteBranch,
  deletePaymentMethod,
  deleteTeamMember,
  getSettings,
  updateBranch,
  updatePaymentMethod,
  updateStoreSettings,
  updateTeamMember,
} from "../controllers/settings.controller.js";

const router = Router();

router.get("/", getSettings);
router.patch("/", updateStoreSettings);
router.post("/branches", createBranch);
router.patch("/branches/:id", updateBranch);
router.delete("/branches/:id", deleteBranch);
router.post("/payment-methods", createPaymentMethod);
router.patch("/payment-methods/:id", updatePaymentMethod);
router.delete("/payment-methods/:id", deletePaymentMethod);
router.post("/users", createTeamMember);
router.patch("/users/:id", updateTeamMember);
router.delete("/users/:id", deleteTeamMember);

export default router;
