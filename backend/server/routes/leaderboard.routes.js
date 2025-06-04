// backend/server/routes/leaderboard.routes.js

import express from "express";
import {
  getTopLifts,
  submitLift,
  getUserRank,
} from "../../controllers/leaderboardController.js";
import { verifyUser } from "../../utils/authMiddleware.js";

const router = express.Router();

// Apply verifyUser middleware to all leaderboard routes in this router
router.use(verifyUser); // This ensures req.user.uid is available for all subsequent handlers

/**
 * GET /api/leaderboard
 * Returns leaderboard data and current user rank.
 * Query Params:
 * - category: e.g., "Bench", "XP", "Streak"
 * - location: e.g., "Global", "gym" (for 'Your Gym')
 * - gymId: Optional, required if location is "gym"
 */
router.get("/", async (req, res) => {
  const { category, location, gymId } = req.query; // gymId is now passed as a query param from frontend

  if (!category || !location) {
    return res.status(400).json({
      success: false,
      error: "Missing required query parameters: category, location.",
    });
  }

  try {
    const userId = req.user?.uid; // Get userId from the authenticated user (from verifyUser middleware)

    // Call controller functions to get data
    const results = await getTopLifts(category, location, gymId);
    const userRankData = await getUserRank(userId, category, location, gymId);

    return res.status(200).json({
      success: true,
      results, // Array of top leaders
      userRank: userRankData.rank, // User's rank
      userBestLift: userRankData.bestLift, // User's best lift entry
    });
  } catch (error) {
    console.error("Error in leaderboard GET route:", error); // For server-side debugging
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to load leaderboard.",
    });
  }
});

/**
 * POST /api/leaderboard
 * Submit a lift record for leaderboard consideration.
 * Body Params:
 * - exercise, weight, reps, gym, location, videoUrl, tier
 * (userId will be added from req.user via verifyUser middleware)
 */
router.post("/", async (req, res) => {
  try {
    const userId = req.user?.uid; // Get userId from the authenticated user
    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized: User ID not found." });
    }

    const payload = { ...req.body, userId }; // Add userId to the payload for submitLift
    const result = await submitLift(payload); // Call refactored submitLift

    if (!result.success) {
      return res.status(400).json({ success: false, error: result.error });
    }
    return res.status(200).json({ success: true, liftId: result.entryId }); // Use entryId from refactored function
  } catch (error) {
    console.error("Error in leaderboard POST route:", error); // For server-side debugging
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to submit lift.",
    });
  }
});

export default router;