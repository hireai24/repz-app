// backend/server/routes/generateMealPlan.routes.js

import express from "express";
import { generateMealPlan } from "../../functions/generateMealPlan.js";
import { verifyUser } from "../../utils/authMiddleware.js";

// Optional logger
const log = { error: () => {} };

const router = express.Router();

/**
 * @route   POST /api/meal
 * @desc    Generate AI-personalized meal plan based on preferences
 * @access  Private (requires valid token via verifyUser middleware)
 */
router.post("/", verifyUser, async (req, res) => {
  try {
    const {
      userId,
      goal,
      dietaryPreferences = "",
      dailyCalories,
      protein,
      carbs,
      fat,
      mealsPerDay,
    } = req.body;
    const user = req.user;

    if (
      !userId ||
      typeof dailyCalories !== "number" ||
      !user ||
      typeof protein !== "number" ||
      typeof carbs !== "number" ||
      typeof fat !== "number" ||
      !goal ||
      typeof goal !== "string"
    ) {
      return res.status(400).json({
        success: false,
        error:
          "userId, goal, dailyCalories, protein, carbs, fat are required. User not authenticated.",
      });
    }

    const planResult = await generateMealPlan({
      user,
      userId,
      goal,
      dietaryPreferences,
      dailyCalories,
      protein,
      carbs,
      fat,
      mealsPerDay,
    });

    if (!planResult.success) {
      return res
        .status(planResult.error?.code === "TIER_RESTRICTED" ? 403 : 400)
        .json({
          success: false,
          error: planResult.error?.message || "Failed to generate meal plan.",
        });
    }

    return res.status(200).json({ success: true, plan: planResult.plan });
  } catch (error) {
    log.error && log.error("Error generating meal plan in route:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to generate meal plan. Please try again.",
    });
  }
});

export default router;
