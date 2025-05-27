import express from "express";
import generateMealPlan from "../../functions/generateMealPlan.js";

const router = express.Router();

/**
 * POST /api/meal
 * Generates a personalized AI meal plan.
 * Expects: userId, dietaryPreferences, dailyCalories
 */
router.post("/", async (req, res) => {
  try {
    const { userId, dietaryPreferences, dailyCalories } = req.body;

    if (!userId || !dailyCalories) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    const plan = await generateMealPlan(
      userId,
      dietaryPreferences,
      dailyCalories,
    );
    return res.status(200).json({ success: true, plan });
  } catch {
    // No console.log, clean error handling for launch
    return res.status(500).json({ error: "Failed to generate meal plan." });
  }
});

export default router;
