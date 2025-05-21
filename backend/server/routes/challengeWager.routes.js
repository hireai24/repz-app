// backend/functions/challengeWager.routes.js

import express from "express";
import {
  createChallenge,
  acceptChallenge,
  submitChallengeResult,
  resolveChallengeOutcome,
} from "../../controllers/challengeWagerController.js";
import {
  getBattleStats,
  updateBattleStats,
} from "../../controllers/battleStatsController.js";
import { submitVote } from "../../functions/voteChallengeResult.js";
import { verifyUser } from "../../utils/authMiddleware.js";

const router = express.Router();

// 🏁 Create a new XP wager challenge
router.post("/create", verifyUser, createChallenge);

// ✅ Accept a challenge (join as opponent)
router.post("/accept/:challengeId", verifyUser, acceptChallenge);

// 📹 Submit proof for a challenge
router.post("/submit/:challengeId", verifyUser, submitChallengeResult);

// 🏆 Resolve a challenge (admin or AI)
router.post("/resolve/:challengeId", verifyUser, resolveChallengeOutcome);

// 🗳 Submit a vote for a challenge result
router.post("/vote/:challengeId", verifyUser, submitVote);

// 📊 Get a user's battle stats (wins/losses/streaks)
router.get("/battle-stats/:userId", verifyUser, getBattleStats);

// 🔁 (Optional) Allow users to manually update stats (admin/debug)
router.post("/battle-stats/:userId", verifyUser, updateBattleStats);

export default router;
