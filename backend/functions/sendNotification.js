// backend/functions/sendNotification.js

import fetch from "node-fetch";
import { getDoc, doc } from "firebase/firestore";
import { db } from "../firebase/init.js";

// Expo Push Notification Endpoint
const EXPO_ENDPOINT = "https://exp.host/--/api/v2/push/send";

/**
 * Send a push notification to a user by their Firestore ID.
 * 
 * @param {string} userId - Firestore user ID
 * @param {Object} message - Notification content
 * @param {string} message.title - Notification title
 * @param {string} message.body - Notification body
 * @param {Object} [message.data] - Optional data payload
 * @returns {Promise<Object>} Result of push notification
 */
export const sendNotification = async (userId, message) => {
  if (!userId || !message?.title || !message?.body) {
    return { success: false, error: "Missing userId or message details" };
  }

  try {
    // Fetch user document to get Expo token
    const userRef = doc(db, "users", userId);
    const snap = await getDoc(userRef);
    if (!snap.exists()) {
      return { success: false, error: "User not found" };
    }

    const userData = snap.data();
    const expoPushToken = userData?.expoPushToken;
    if (!expoPushToken || !expoPushToken.startsWith("ExponentPushToken")) {
      return { success: false, error: "Invalid Expo push token" };
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
        "Accept": "application/json",
        "Accept-Encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (result?.data?.status === "ok") {
      return { success: true };
    } else {
      console.warn("Expo push failed", result);
      return { success: false, error: result?.data?.message || "Unknown error" };
    }
  } catch (err) {
    console.error("sendNotification error:", err);
    return { success: false, error: "Internal server error" };
  }
};
