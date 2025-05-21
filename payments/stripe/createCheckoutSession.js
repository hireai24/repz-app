import express from "express";
import Stripe from "stripe";

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-08-16",
});

router.post("/", async (req, res) => {
  const { priceId, userId, metadata = {} } = req.body;

  if (
    !priceId ||
    typeof priceId !== "string" ||
    !userId ||
    typeof userId !== "string"
  ) {
    return res.status(400).json({
      success: false,
      error: "Missing or invalid parameters: priceId and userId are required.",
    });
  }

  // Only allow certain metadata fields
  const email = typeof metadata.email === "string" ? metadata.email : undefined;

  // Ensure redirect domains are safe
  const FRONTEND_URL = process.env.FRONTEND_URL || "";
  const isValidUrl = /^https:\/\/[\w.-]+$/.test(FRONTEND_URL);
  if (!isValidUrl) {
    return res.status(500).json({
      success: false,
      error: "Invalid FRONTEND_URL in environment variables.",
    });
  }

  try {
    // 🔥 Validate that the Price ID actually exists and is active
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
        ...(email && { email }), // Optional
      },
      success_url: `${FRONTEND_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${FRONTEND_URL}/payment-cancelled`,
    });

    return res
      .status(200)
      .json({ success: true, sessionId: session.id, url: session.url });
  } catch (err) {
    console.error(
      "❌ Stripe checkout session error:",
      err.response?.data || err.message,
    );
    return res
      .status(500)
      .json({ success: false, error: "Failed to create checkout session." });
  }
});

export default router;
