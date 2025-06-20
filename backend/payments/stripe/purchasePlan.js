// backend/payments/stripe/purchasePlan.js

import express from "express";
import Stripe from "stripe";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase/init.js";
import { verifyUser } from "../../utils/authMiddleware.js";

// Optional logger (production: swap for real logger)
const log = { error: () => {} };

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-08-16",
});

router.post("/", verifyUser, async (req, res) => {
  const { planId } = req.body;
  const buyerId = req.user?.uid;
  const buyerEmail = req.user?.email;

  if (!planId || typeof planId !== "string" || !buyerId || !buyerEmail) {
    return res
      .status(400)
      .json({ success: false, error: "Missing or invalid request fields" });
  }

  try {
    const planRef = doc(db, "plans", planId);
    const planSnap = await getDoc(planRef);

    if (!planSnap.exists()) {
      return res.status(404).json({ success: false, error: "Plan not found" });
    }

    const plan = planSnap.data();

    if (
      !plan.price ||
      typeof plan.price !== "number" ||
      plan.price <= 0 ||
      !plan.userId ||
      !plan.title
    ) {
      return res.status(400).json({
        success: false,
        error: "Invalid plan data (price, creator, or title missing)",
      });
    }

    const creatorRef = doc(db, "users", plan.userId);
    const creatorSnap = await getDoc(creatorRef);

    if (!creatorSnap.exists()) {
      return res
        .status(404)
        .json({ success: false, error: "Creator not found" });
    }

    const creator = creatorSnap.data();

    if (!creator?.stripeAccountId) {
      return res
        .status(400)
        .json({ success: false, error: "Creator has not connected payouts" });
    }

    const amountInCents = Math.round(plan.price * 100);
    const platformFee = Math.round(amountInCents * 0.1);

    const FRONTEND_URL = process.env.FRONTEND_URL;
    if (!FRONTEND_URL || !/^https?:\/\/.+/.test(FRONTEND_URL)) {
      log.error("Invalid or missing FRONTEND_URL environment variable.");
      return res.status(500).json({
        success: false,
        error: "Server configuration error: Invalid FRONTEND_URL.",
      });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      customer_email: buyerEmail,
      line_items: [
        {
          price_data: {
            currency: "gbp",
            product_data: {
              name: plan.title,
              description:
                plan.description || `Purchase of ${plan.title} plan.`,
            },
            unit_amount: amountInCents,
          },
          quantity: 1,
        },
      ],
      payment_intent_data: {
        application_fee_amount: platformFee,
        transfer_data: {
          destination: creator.stripeAccountId,
        },
      },
      metadata: {
        userId: buyerId,
        planId,
        planName: plan.title,
        creatorId: plan.userId,
        amountPaid: amountInCents,
      },
      success_url: `${FRONTEND_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${FRONTEND_URL}/payment-cancelled`,
    });

    return res.status(200).json({
      success: true,
      sessionId: session.id,
      url: session.url,
    });
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      log.error && log.error("Stripe purchase session creation error:", err);
    }
    return res.status(500).json({
      success: false,
      error: `Failed to create checkout session: ${
        process.env.NODE_ENV !== "production"
          ? err.message
          : "Please try again later."
      }`,
    });
  }
});

export default router;
