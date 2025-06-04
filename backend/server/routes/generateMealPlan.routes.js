import express from "express";
import { generateMealPlan } from "../../functions/generateMealPlan.js"; // NOW POINTS TO THE RENAMED FILE
import { verifyUser } from "../../utils/authMiddleware.js";

const router = express.Router();

/**
 * @route   POST /api/meal
 * @desc    Generate AI-personalized meal plan based on preferences
 * @access  Private (requires valid token via verifyUser middleware)
 */
router.post("/", verifyUser, async (req, res) => {
  try {
    // ADDED 'goal' to destructuring and validation
    const { userId, goal, dietaryPreferences = "", dailyCalories, protein, carbs, fat, mealsPerDay } = req.body;
    const user = req.user; // Get full user object from verifyUser middleware

    // Basic field validation - ADDED 'goal' to validation
    if (!userId || typeof dailyCalories !== "number" || !user || typeof protein !== 'number' || typeof carbs !== 'number' || typeof fat !== 'number' || !goal || typeof goal !== 'string') {
      return res
        .status(400)
        .json({ success: false, error: "userId, goal, dailyCalories, protein, carbs, fat are required. User not authenticated." });
    }

    const planResult = await generateMealPlan({
      user, // PASSED: user object for tier check in generateMealPlan function
      userId,
      goal, // PASSED: goal explicitly
      dietaryPreferences,
      dailyCalories,
      protein,
      carbs,
      fat,
      mealsPerDay,
    });

    if (!planResult.success) {
      return res
        .status(planResult.error?.code === "TIER_RESTRICTED" ? 403 : 400) // Return 403 for tier issues
        .json({ success: false, error: planResult.error?.message || "Failed to generate meal plan." });
    }

    // Backend now returns 'plan' which is the structured array
    return res.status(200).json({ success: true, plan: planResult.plan });
  } catch (error) {
    console.error("Error generating meal plan in route:", error); // Server-side logging
    return res
      .status(500)
      .json({ success: false, error: "Failed to generate meal plan. Please try again." });
  }
});

export default router;