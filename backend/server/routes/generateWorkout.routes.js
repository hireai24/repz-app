// backend/server/routes/generateWorkout.routes.js

import express from "express";
import generateWorkout from "../../functions/generateWorkout.js";
import { verifyUser } from "../../utils/authMiddleware.js"; // ADDED: Import verifyUser

const router = express.Router();

/**
 * POST /api/workout/generate
 * Generates a personalized workout plan using AI.
 * Expects JSON with: fitnessGoal, equipment (optional), injuries (optional), etc.
 * Access: Protected (requires valid token via verifyUser middleware)
 */
router.post("/generate", verifyUser, async (req, res) => { // ADDED: /generate sub-path and verifyUser middleware
  try {
    const userId = req.user?.uid; // Get userId from verified user
    const user = req.user; // Get full user object for tier check in generateWorkout
    const { fitnessGoal, equipment, injuries, availableDays, preferredSplit, experienceLevel } = req.body;

    if (!userId || !fitnessGoal || !availableDays || !preferredSplit || !experienceLevel) { // Added checks for required fields
      return res.status(400).json({
        success: false,
        error: "Missing required fields: fitnessGoal, availableDays, preferredSplit, experienceLevel.",
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
      user, // PASSED: user object for tier check in generateWorkout
    );

    if (!planResult.success) {
      // Use status from planResult if available (e.g., 403 for tier restriction)
      return res.status(planResult.status || 400).json({ success: false, error: planResult.error });
    }

    return res.status(200).json({ success: true, plan: planResult.workoutPlan, planId: planResult.planId }); // Return planId too
  } catch (error) {
    console.error("Error generating workout:", error); // Re-added for server-side debugging
    return res
      .status(500)
      .json({ success: false, error: error.message || "Failed to generate workout." });
  }
});

export default router;