import express from "express";
import generateWorkout from "../../backend/functions/generateWorkout.js";

const router = express.Router();

/**
 * POST /api/workout
 * Generates a personalized workout plan.
 * Expects: userId, fitnessGoal, equipment (optional), injuries (optional)
 */
router.post("/", async (req, res) => {
  try {
    const { userId, fitnessGoal, equipment = [], injuries = [] } = req.body;

    if (!userId || !fitnessGoal) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    const plan = await generateWorkout(userId, fitnessGoal, equipment, injuries);

    res.status(200).json({ success: true, plan });
  } catch (err) {
    console.error("🔥 Error in /api/workout:", err.message);
    res.status(500).json({ error: "Failed to generate workout." });
  }
});

export default router;
