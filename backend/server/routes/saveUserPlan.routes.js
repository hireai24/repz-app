// 📍 File: backend-server/routes/saveUserPlan.routes.js

import express from "express";
import saveUserPlan from "../../functions/saveUserPlan.js";

const router = express.Router();

/**
 * @route   POST /api/save-plan
 * @desc    Saves a user's generated workout or meal plan
 * @access  Public or protected (adjust middleware if needed)
 */
router.post("/", async (req, res) => {
  try {
    const { userId, planData, type } = req.body;

    if (!userId || !planData || !type) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    const result = await saveUserPlan(userId, planData, type);
    return res.status(200).json(result);
  } catch (error) {
    // TODO: Replace with production logger if needed
    return res.status(500).json({ error: "Server error saving plan." });
  }
});

export default router;
