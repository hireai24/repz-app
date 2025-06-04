// backend/server/routes/mealManagement.routes.js
import express from "express";
import { saveMealPlan, getUserMealPlans } from "../../controllers/mealController.js";
import { verifyUser } from "../../utils/authMiddleware.js";

const router = express.Router();

/**
 * @route   POST /api/user-meals/save
 * @desc    Save a user's custom or AI-generated meal plan
 * @access  Private (requires valid token via verifyUser middleware)
 */
router.post("/save", verifyUser, saveMealPlan);

/**
 * @route   GET /api/user-meals/saved/:userId
 * @desc    Get all meal plans for a user, newest first, paginated
 * @access  Private (requires valid token via verifyUser middleware)
 */
router.get("/saved/:userId", verifyUser, getUserMealPlans);

export default router;