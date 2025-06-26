import express from "express";
import Stripe from "stripe";
import { verifyUser } from "../../utils/authMiddleware.js";

const router = express.Router();
const STRIPE_API_VERSION = "2023-10-16";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: STRIPE_API_VERSION,
});

// POST /stripe/checkout (for subscriptions)
router.post("/", verifyUser, async (req, res) => {
  const userId = req.user?.uid;
  const email = req.user?.email;
  const { priceId } = req.body; // metadata removed (wasn't used)

  if (
    !priceId ||
    typeof priceId !== "string" ||
    !userId ||
    typeof userId !== "string" ||
    !email
  ) {
    return res.status(400).json({
      success: false,
      error:
        "Missing or invalid parameters: priceId, userId, or email is required.",
    });
  }

  const FRONTEND_URL = process.env.FRONTEND_URL;
  if (!FRONTEND_URL || !/^https?:\/\/.+/.test(FRONTEND_URL)) {
    // eslint-disable-next-line no-console
    console.error("Invalid or missing FRONTEND_URL environment variable.");
    return res.status(500).json({
      success: false,
      error: "Server configuration error: Invalid FRONTEND_URL.",
    });
  }

  try {
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
        email,
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
      console.error(
        "❌ Stripe checkout session error:",
        err.message,
        err.raw || err,
      );
    }
    return res.status(500).json({
      success: false,
      error: `Failed to create checkout session: ${process.env.NODE_ENV !== "production" ? err.message : "Please try again later."}`,
    });
  }
});

export default router;
