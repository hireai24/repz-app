// backend/server/routes/sendNotification.routes.js
import express from "express";
import { sendNotificationHandler } from "./sendNotificationController.js";
import { verifyUser } from "../../utils/authMiddleware.js";

const router = express.Router();

/**
 * @route   POST /api/notify
 * @desc    Send a push notification to a specific user (direct)
 * @access  Private (requires auth middleware)
 */
router.post("/", verifyUser, sendNotificationHandler);

export default router;
