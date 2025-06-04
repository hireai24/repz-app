// backend/server/routes/marketplace.routes.js

import express from "express";
import {
  getMarketplacePlans,
  uploadPlan,
  getPlanById,
  updatePlan,
  deletePlan,
} from "../../controllers/planController.js";
import { verifyUser, verifyAdmin } from "../../utils/authMiddleware.js";

const router = express.Router();

// Public route to get all marketplace plans (can be filtered)
router.get("/", getMarketplacePlans);

// Get a single plan by ID (can be public view)
router.get("/:planId", getPlanById);

// Routes requiring authentication
router.use(verifyUser); // Apply verifyUser middleware to all subsequent routes

// Upload a new plan to the marketplace (requires user login)
router.post("/upload", uploadPlan);

// Update an existing plan (requires user login and ownership/admin - ownership check should be in controller)
router.patch("/update/:planId", updatePlan);

// Delete a plan (requires admin privileges)
router.delete("/delete/:planId", verifyAdmin, deletePlan);

export default router;