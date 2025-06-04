// backend/server/routes/challengeWager.routes.js

import express from "express";
import {
  createChallenge,
  acceptChallenge,
  submitChallengeResult,
  resolveChallengeOutcome,
} from "../../controllers/challengeWagerController.js";
import {
  getBattleStats,
  // updateBattleStats, // DO NOT IMPORT THIS FOR PUBLIC ROUTE
} from "../../controllers/battleStatsController.js";
import { submitVote } from "../../functions/voteChallengeResult.js"; // This should be a function not a controller

import { verifyUser } from "../../utils/authMiddleware.js";

const router = express.Router();

// Create a new XP wager challenge
router.post("/create", verifyUser, createChallenge);

// Accept a challenge (join as opponent)
router.post("/accept/:challengeId", verifyUser, acceptChallenge);

// Submit proof for a challenge
router.post("/submit/:challengeId", verifyUser, submitChallengeResult);

// Resolve a challenge (admin or AI trigger) - This route should be secured very carefully
// Only allow specific users (admins) or internal systems to call this, or remove if automated.
// For now, it retains `verifyUser` but consider more granular role-based access.
router.post("/resolve/:challengeId", verifyUser, resolveChallengeOutcome);

// Submit a vote for a challenge result
router.post("/vote/:challengeId", verifyUser, submitVote);

// Get a user's battle stats (wins/losses/streaks)
router.get("/battle-stats/:userId", verifyUser, getBattleStats);

// ✅ CRITICAL: REMOVED THE FOLLOWING ROUTE DUE TO SECURITY VULNERABILITY:
// router.post("/battle-stats/:userId", verifyUser, updateBattleStats);
// updateBattleStats should ONLY be called internally by backend functions like resolveChallengeOutcome.

export default router;