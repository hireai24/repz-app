import crypto from "crypto";
import express from "express";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../backend/firebase/init.js";

const router = express.Router();
const REVENUECAT_WEBHOOK_SECRET = process.env.REVENUECAT_WEBHOOK_SECRET;

if (!REVENUECAT_WEBHOOK_SECRET) {
  throw new Error(
    "❌ Missing REVENUECAT_WEBHOOK_SECRET in environment variables.",
  );
}

/**
 * Securely verify RevenueCat webhook signature (SHA1 HMAC)
 */
const verifyRevenueCatSignature = (rawBody, signature) => {
  const expectedSignature = crypto
    .createHmac("sha1", REVENUECAT_WEBHOOK_SECRET)
    .update(rawBody)
    .digest("hex");

  const bufferExpected = Buffer.from(expectedSignature, "hex");
  const bufferProvided = Buffer.from(signature || "", "hex");

  return (
    bufferExpected.length === bufferProvided.length &&
    crypto.timingSafeEqual(bufferExpected, bufferProvided)
  );
};

/**
 * Maps RevenueCat event entitlements to tier string.
 */
const mapEventToTier = (event, entitlementIds) => {
  const entitlements = event.entitlement_ids || [];
  if (entitlements.includes(entitlementIds.elite)) return "elite";
  if (entitlements.includes(entitlementIds.pro)) return "pro";
  return null;
};

// Middleware to capture raw body for signature verification
router.use(
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf.toString();
    },
  }),
);

router.post("/webhook", async (req, res) => {
  try {
    const signature = req.headers["x-revenuecat-signature"];

    if (!verifyRevenueCatSignature(req.rawBody, signature)) {
      if (process.env.NODE_ENV !== "production") {
        // eslint-disable-next-line no-console
        console.error("❌ Invalid RevenueCat webhook signature.");
      }
      return res
        .status(401)
        .json({ success: false, error: "Invalid webhook signature." });
    }

    const event = req.body.event;
    const userId = req.body.app_user_id;

    if (!userId || !event) {
      return res
        .status(400)
        .json({ success: false, error: "Missing userId or event in payload." });
    }

    const entitlementIds = {
      pro: "pro_access",
      elite: "elite_access",
    };

    const tier = mapEventToTier(event, entitlementIds);

    if (!tier) {
      if (process.env.NODE_ENV !== "production") {
        // eslint-disable-next-line no-console
        console.warn(
          `⚠️ No matching entitlement found for userId ${userId}. Event type: ${event.type}`,
        );
      }
      return res.status(200).json({
        success: true,
        message: "No valid entitlement found; no update performed.",
      });
    }

    const userRef = doc(db, "users", userId);

    await updateDoc(userRef, {
      tier,
      lastSubscriptionEvent: event.type,
      updatedAt: new Date().toISOString(),
    });

    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.log(`✅ User ${userId} updated to tier ${tier}.`);
    }
    return res.status(200).json({ success: true, tier });
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.error("🔥 RevenueCat webhook error:", err.message || err);
    }
    return res
      .status(500)
      .json({ success: false, error: err.message || "Internal server error." });
  }
});

export default router;
