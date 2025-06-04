// backend/server/routes/notification.routes.js

import express from "express";
import { notifyChallengeMessage } from "../../controllers/notificationController.js";
import { sendNotificationHandler } from "../../functions/sendNotification.js"; // ✅ Import the generic handler

const router = express.Router();

/**
 * POST /api/notify/challengeMessage
 * Triggers push notification when a new message is sent in a challenge thread.
 * @body {string} challengeId, {string} senderId, {string} message, {string} [senderUsername]
 */
router.post("/challengeMessage", notifyChallengeMessage); // Changed route name for clarity

/**
 * POST /api/notify/sendSingle
 * Triggers a generic push notification to a single user.
 * @body {string} userId, {string} title, {string} body, {Object} [data]
 */
router.post("/sendSingle", sendNotificationHandler); // ✅ Added new route for generic send

export default router;