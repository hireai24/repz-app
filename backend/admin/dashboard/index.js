// backend/admin/dashboard/index.js

import express from "express";
import { verifyAdmin } from "../../utils/authMiddleware.js";

import reviewChallenges from "./reviewChallenges.js";
import manageUsers from "./manageUsers.js";
import highlightPlans from "./highlightPlans.js";

const router = express.Router();

// Apply verifyAdmin middleware to all admin routes
router.use(verifyAdmin);

// Admin health check
router.get("/", (req, res) => {
  const uid = req.user?.uid || "Unknown";
  const userAgent = req.headers["user-agent"] || "Unknown";

  res.status(200).json({
    success: true,
    message: "REPZ Admin Dashboard is live",
    status: "OK",
    version: "1.0.0",
    uid,
    userAgent,
    timestamp: new Date().toISOString(),
  });
});

// Mount core admin routes
router.use("/review-challenges", reviewChallenges);
router.use("/manage-users", manageUsers);
router.use("/highlight-plans", highlightPlans);

export default router;
