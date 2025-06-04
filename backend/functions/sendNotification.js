// backend/functions/sendNotification.js

import fetch from "node-fetch";
import { getDoc, doc } from "firebase/firestore";
import { db } from "../firebase/init.js";

// Expo Push Notification Endpoint
const EXPO_ENDPOINT = "https://exp.host/--/api/v2/push/send";

/**
 * Send a push notification to a user by their Firestore ID.
 * This function is for internal backend use by other services/functions.
 * For external API calls, use `sendNotificationHandler`.
 *
 * @param {string} userId - Firestore user ID
 * @param {Object} message - Notification content
 * @param {string} message.title - Notification title
 * @param {string} message.body - Notification body
 * @param {Object} [message.data] - Optional data payload
 * @returns {Promise<Object>} Result of push notification (success: boolean, error?: string, details?: any)
 */
export const sendNotification = async (userId, message) => {
  if (!userId || !message?.title || !message?.body) {
    return { success: false, error: "Missing userId or message details." };
  }

  try {
    const userRef = doc(db, "users", userId);
    const snap = await getDoc(userRef);
    if (!snap.exists()) {
      return { success: false, error: `User with ID ${userId} not found.` };
    }

    const userData = snap.data();
    const expoPushToken = userData?.expoPushToken; // Assuming the field is expoPushToken
    if (!expoPushToken || !expoPushToken.startsWith("ExponentPushToken")) {
      return { success: false, error: "Invalid or missing Expo push token for user." };
    }

    const payload = {
      to: expoPushToken,
      sound: "default",
      title: message.title,
      body: message.body,
      data: message.data || {},
    };

    const response = await fetch(EXPO_ENDPOINT, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-Encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (result?.data?.status === "ok") {
      return { success: true, details: result.data };
    } else {
      console.error(`Expo Push API error for user ${userId}:`, result); // Log Expo's specific error
      return {
        success: false,
        error: result?.data?.message || "Failed to send notification via Expo API.",
        details: result,
      };
    }
  } catch (error) {
    console.error(`Internal server error sending notification to ${userId}:`, error);
    return { success: false, error: "Internal server error." };
  }
};

/**
 * Express handler to send a push notification to a specific user.
 * @route POST /api/notify/sendSingle
 * @access Private (Assumes authentication middleware is applied)
 * @body {string} userId - Target user ID
 * @body {string} title - Notification title
 * @body {string} body - Notification body
 * @body {Object} [data] - Optional data payload
 */
export const sendNotificationHandler = async (req, res) => {
  const { userId, title, body, data } = req.body;
  if (!userId || !title || !body) {
    return res.status(400).json({ success: false, error: "Missing required fields: userId, title, or body." });
  }

  const result = await sendNotification(userId, { title, body, data });

  if (result.success) {
    return res.status(200).json({ success: true, message: "Notification sent successfully." });
  } else {
    return res.status(500).json({ success: false, error: result.error, details: result.details });
  }
};