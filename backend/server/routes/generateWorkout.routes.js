// backend/server/routes/generateWorkout.routes.js

import express from "express";
import generateWorkout from "../../functions/generateWorkout.js"; // ✅ Fixed import (default)

const router = express.Router();

/**
 * POST /api/workout
 * Generates a personalized workout plan.
 * Expects JSON with: userId, fitnessGoal, equipment (optional), injuries (optional)
 */
router.post("/", async (req, res) => {
  try {
    const { userId, fitnessGoal, equipment = "", injuries = "" } = req.body;

    if (!userId || !fitnessGoal) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: userId and fitnessGoal.",
      });
    }

    const plan = await generateWorkout(userId, {
      goal: fitnessGoal,
      equipment,
      injuries,
      availableDays: 4, // Default value, you can expose this in req.body if needed
      preferredSplit: "Push/Pull/Legs",
      experienceLevel: "Intermediate",
    });

    if (!plan.success) {
      return res.status(400).json({ success: false, error: plan.error });
    }

    return res.status(200).json({ success: true, plan });
  } catch {
    // No console.log in production; clean error handling
    return res
      .status(500)
      .json({ success: false, error: "Failed to generate workout." });
  }
});

export default router;
