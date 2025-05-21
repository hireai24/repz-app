// 📍 File: backend-server/routes/trackXP.routes.js

import express from "express";
import trackXP from "../../functions/trackXP.js";

const router = express.Router();

/**
 * @route   POST /api/xp
 * @desc    Tracks XP gain for a user after a workout or challenge
 * @access  Public or protected (apply authMiddleware if needed)
 */
router.post("/", async (req, res) => {
  try {
    const { userId, source, amount } = req.body;

    if (!userId || !source || !amount) {
      return res.status(400).json({ error: "Missing required XP tracking fields." });
    }

    const result = await trackXP(userId, source, amount);
    return res.status(200).json(result);
  } catch (error) {
    console.error("❌ XP tracking error:", error.message);
    return res.status(500).json({ error: "Failed to track XP." });
  }
});

export default router;
