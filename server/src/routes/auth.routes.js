import { Router } from "express";
import {
  currentUser,
  setupOwner,
  setupStatus,
  signIn,
  signOut,
  updatePassword,
  updateProfilePhoto,
} from "../controllers/auth.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/setup-status", setupStatus);
router.post("/setup", setupOwner);
router.post("/login", signIn);
router.get("/me", authenticate, currentUser);
router.post("/logout", signOut);
router.post("/password", authenticate, updatePassword);
router.put("/avatar", authenticate, updateProfilePhoto);

export default router;
