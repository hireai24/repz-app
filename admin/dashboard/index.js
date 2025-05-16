import express from "express";

import { verifyAdmin } from "../../backend/utils/authMiddleware.js";

import reviewChallenges from "./reviewChallenges.js";
import manageUsers from "./manageUsers.js";
import highlightPlans from "./highlightPlans.js";

const router = express.Router();

// Optional: Future-proofing for rate limiting (e.g., express-rate-limit)
// import rateLimit from "express-rate-limit";
// const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
// router.use(limiter);

// Apply verifyAdmin middleware to all admin routes
router.use(verifyAdmin);

// Admin health check
router.get("/", (req, res) => {
  const uid = req.user?.uid || "Unknown";
  const userAgent = req.headers["user-agent"] || "Unknown";

  // Use structured log format (remove for production logging frameworks like Winston)
  if (process.env.NODE_ENV !== "production") {
    console.log(`[ADMIN PING] ${new Date().toISOString()} | UID: ${uid} | Agent: ${userAgent}`);
  }

  res.status(200).json({
    success: true,
    message: "REPZ Admin Dashboard is live",
    status: "OK",
    version: "1.0.0",
    uid,
    userAgent,
    timestamp: new Date().toISOString()
  });
});

// Mount core admin routes
router.use("/review-challenges", reviewChallenges);
router.use("/manage-users", manageUsers);
router.use("/highlight-plans", highlightPlans);

export default router;
