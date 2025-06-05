// backend/server/routes/generateWorkout.routes.js

import express from "express";
import generateWorkout from "../../functions/generateWorkout.js";
import { verifyUser } from "../../utils/authMiddleware.js";

// Optional logger (swap for winston/pino in prod)
const log = { error: () => {} };

const router = express.Router();

/**
 * POST /api/workout/generate
 * Generates a personalized workout plan using AI.
 * Expects JSON with: fitnessGoal, equipment (optional), injuries (optional), etc.
 * Access: Protected (requires valid token via verifyUser middleware)
 */
router.post("/generate", verifyUser, async (req, res) => {
  try {
    const userId = req.user?.uid;
    const user = req.user;
    const {
      fitnessGoal,
      equipment,
      injuries,
      availableDays,
      preferredSplit,
      experienceLevel,
    } = req.body;

    if (
      !userId ||
      !fitnessGoal ||
      !availableDays ||
      !preferredSplit ||
      !experienceLevel
    ) {
      return res.status(400).json({
        success: false,
        error:
          "Missing required fields: fitnessGoal, availableDays, preferredSplit, experienceLevel.",
      });
    }

    const planResult = await generateWorkout(
      userId,
      {
        goal: fitnessGoal,
        equipment: equipment || "",
        injuries: injuries || "",
        availableDays,
        preferredSplit,
        experienceLevel,
      },
      user,
    );

    if (!planResult.success) {
      return res
        .status(planResult.status || 400)
        .json({ success: false, error: planResult.error });
    }

    return res.status(200).json({
      success: true,
      plan: planResult.workoutPlan,
      planId: planResult.planId,
    });
  } catch (error) {
    log.error && log.error("Error generating workout:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to generate workout.",
    });
  }
});

export default router;
