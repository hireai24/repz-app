// 📍 File: backend-server/routes/weeklySummary.routes.js

import express from "express";
import weeklySummary from "../../functions/weeklySummary.js";

const router = express.Router();

/**
 * @route   POST /api/weekly-summary
 * @desc    Generates a weekly performance summary for the user
 * @access  Public or protected (add authMiddleware if needed)
 */
router.post("/", async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res
        .status(400)
        .json({ error: "Missing userId for weekly summary." });
    }

    const summary = await weeklySummary(userId);
    return res.status(200).json({ success: true, summary });
  } catch (error) {
    // TODO: Replace with production logger if required
    return res
      .status(500)
      .json({ error: "Failed to generate weekly summary." });
  }
});

export default router;
