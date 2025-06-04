import fetch from "node-fetch";
import { getUserPushTokens } from "../utils/userUtils.js";

/**
 * Notify users in a challenge thread via Expo Push Notification
 * @route POST /api/notify/challengeMessage
 * @access Private (Assumes authentication middleware is applied)
 * @body {string} challengeId - ID of the challenge thread
 * @body {string} senderId - The userId of the sender (to exclude their token)
 * @body {string} message - The actual message text
 * @body {string} [senderUsername] - Optional, for richer notification title
 */
export const notifyChallengeMessage = async (req, res) => {
  try {
    const { challengeId, senderId, message, senderUsername } = req.body;

    if (!challengeId || !senderId || !message) {
      return res.status(400).json({ success: false, error: "Missing required fields: challengeId, senderId, message." });
    }

    // Get tokens for all participants in the challenge, excluding the sender
    const tokens = await getUserPushTokens(challengeId, senderId);

    if (!tokens.length) {
      // console.log(`No push tokens found for challenge ${challengeId} (excluding sender ${senderId}).`); // For dev debugging
      return res
        .status(200)
        .json({ success: true, message: "No relevant tokens found to notify." });
    }

    const notifications = tokens.map((token) => ({
      to: token,
      sound: "default",
      title: senderUsername
        ? `${senderUsername} sent a message in ${challengeId}`
        : `New message in ${challengeId}`,
      body: message,
      data: { challengeId, type: "challenge_message", senderId }, // Add more context to data
    }));

    // Send notifications to Expo
    const expoRes = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-Encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(notifications),
    });

    const result = await expoRes.json();
    // console.log("Expo push notification response:", result); // For dev debugging

    if (result.errors && result.errors.length > 0) {
      console.error("Errors from Expo Push API:", result.errors);
      return res.status(500).json({ success: false, error: "Some notifications failed to send.", details: result.errors });
    }

    return res.status(200).json({ success: true, result });
  } catch (error) {
    console.error("Error in notifyChallengeMessage:", error); // Detailed error logging
    return res.status(500).json({ success: false, error: "Failed to send notifications due to internal server error." });
  }
};