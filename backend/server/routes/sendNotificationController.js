// backend/server/routes/sendNotificationController.js
import admin from "firebase-admin";

/**
 * @desc Sends a notification using Firebase Cloud Messaging
 * @route POST /api/notify
 * @access Private (requires verified token)
 */
export const sendNotificationHandler = async (req, res) => {
  try {
    const { title, body, token } = req.body;

    if (!title || !body || !token) {
      return res
        .status(400)
        .json({ success: false, message: "Missing fields" });
    }

    const message = {
      notification: { title, body },
      token,
    };

    const response = await admin.messaging().send(message);
    return res.status(200).json({ success: true, response });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.error("Notification Error:", error);
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};
