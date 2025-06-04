// backend/payments/stripe/createCheckoutSession.js

import express from "express";
import Stripe from "stripe";
import { verifyUser } from "../../utils/authMiddleware.js"; // Import verifyUser

const router = express.Router();
const STRIPE_API_VERSION = "2023-10-16"; // Standardize API Version
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: STRIPE_API_VERSION,
});

// POST /stripe/checkout (for subscriptions)
router.post("/", verifyUser, async (req, res) => { // ADDED: verifyUser middleware
  // Get userId and email from the authenticated user, not req.body
  const userId = req.user?.uid;
  const email = req.user?.email;
  const { priceId, metadata = {} } = req.body; // priceId still comes from body

  if (
    !priceId ||
    typeof priceId !== "string" ||
    !userId ||
    typeof userId !== "string" ||
    !email // Email is now mandatory if verified via auth
  ) {
    return res.status(400).json({
      success: false,
      error: "Missing or invalid parameters: priceId, userId, or email is required.",
    });
  }

  // Ensure redirect domains are safe
  const FRONTEND_URL = process.env.FRONTEND_URL;
  if (!FRONTEND_URL || !/^https?:\/\/.+/.test(FRONTEND_URL)) { // More robust URL validation
    console.error("Invalid or missing FRONTEND_URL environment variable.");
    return res.status(500).json({
      success: false,
      error: "Server configuration error: Invalid FRONTEND_URL.",
    });
  }

  try {
    // Validate that the Price ID actually exists and is active
    const price = await stripe.prices.retrieve(priceId);

    if (!price || price.active !== true) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid or inactive priceId." });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      customer_email: email,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      metadata: {
        userId,
        email, // Pass email to webhook via metadata
        // You might want to pass more specific subscription info here if needed by the webhook
        // e.g., tier: "Pro" if tier information is available on the frontend or associated with priceId
        // For now, assuming webhook derives tier from price or defaults to "Pro"
      },
      success_url: `${FRONTEND_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${FRONTEND_URL}/payment-cancelled`,
    });

    return res
      .status(200)
      .json({ success: true, sessionId: session.id, url: session.url });
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.error("❌ Stripe checkout session error:", err.message, err.raw || err); // Log full error details for dev
    }
    return res
      .status(500)
      .json({ success: false, error: `Failed to create checkout session: ${process.env.NODE_ENV !== "production" ? err.message : "Please try again later."}` });
  }
});

export default router;