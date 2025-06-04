// backend/routes/user.routes.js
import express from "express";
import {
  getUserById,
  updateUserById,
  deleteUserById,
  resetPassword,
  getStripeOnboardingLink,
  getUserEntitlements,
} from "../../controllers/userController.js"; // Corrected path
import { verifyUser } from "../../utils/authMiddleware.js"; // Corrected path

const router = express.Router();

// Profile CRUD
router.get("/:userId", verifyUser, getUserById);
router.put("/update/:userId", verifyUser, updateUserById);
router.delete("/delete/:userId", verifyUser, deleteUserById);

// Password reset
router.post("/password-reset", resetPassword);

// Stripe
router.post("/stripe-onboard/:userId", verifyUser, getStripeOnboardingLink);

// Entitlements
router.get("/entitlements/:userId", verifyUser, getUserEntitlements);

export default router;
