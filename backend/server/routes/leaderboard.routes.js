// backend/server/routes/leaderboard.routes.js

import express from "express";
import {
  getTopLifts,
  submitLift,
  getUserRank,
} from "../../controllers/leaderboardController.js";
import { verifyUser } from "../../utils/authMiddleware.js";

// Optional logger (swap for real logger if needed)
const log = { error: () => {} };

const router = express.Router();

router.use(verifyUser);

router.get("/", async (req, res) => {
  const { category, location, gymId } = req.query;

  if (!category || !location) {
    return res.status(400).json({
      success: false,
      error: "Missing required query parameters: category, location.",
    });
  }

  try {
    const userId = req.user?.uid;
    const results = await getTopLifts(category, location, gymId);
    const userRankData = await getUserRank(userId, category, location, gymId);

    return res.status(200).json({
      success: true,
      results,
      userRank: userRankData.rank,
      userBestLift: userRankData.bestLift,
    });
  } catch (error) {
    log.error && log.error("Error in leaderboard GET route:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to load leaderboard.",
    });
  }
});

router.post("/", async (req, res) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      return res
        .status(401)
        .json({ success: false, error: "Unauthorized: User ID not found." });
    }

    const payload = { ...req.body, userId };
    const result = await submitLift(payload);

    if (!result.success) {
      return res.status(400).json({ success: false, error: result.error });
    }
    return res.status(200).json({ success: true, liftId: result.entryId });
  } catch (error) {
    log.error && log.error("Error in leaderboard POST route:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to submit lift.",
    });
  }
});

export default router;
