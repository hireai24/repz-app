// payments/stripe/purchasePlan.js

import express from "express";
import Stripe from "stripe";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase/init.js";
import { verifyUser } from "../../utils/authMiddleware.js";

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-08-16",
});

// POST /stripe/purchase-plan
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

    // Ensure plan has essential fields for purchase
    if (
      !plan.price ||
      typeof plan.price !== "number" ||
      plan.price <= 0 ||
      !plan.userId ||
      !plan.title // Ensure plan title exists for Stripe checkout display and purchase logging
    ) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid plan data (price, creator, or title missing)" });
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
    const platformFee = Math.round(amountInCents * 0.1); // 10% platform cut

    const FRONTEND_URL = process.env.FRONTEND_URL; // Using environment variable directly
    // A robust URL validation for production should be in place where FRONTEND_URL is set,
    // or use a more comprehensive validator here if it could be dynamic.
    if (!FRONTEND_URL || !/^https?:\/\/.+/.test(FRONTEND_URL)) {
       console.error("Invalid or missing FRONTEND_URL environment variable.");
       return res
         .status(500)
         .json({ success: false, error: "Server configuration error: Invalid FRONTEND_URL." });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      customer_email: buyerEmail,
      line_items: [
        {
          price_data: {
            currency: "gbp", // Consider making currency dynamic if needed
            product_data: {
              name: plan.title,
              description: plan.description || `Purchase of ${plan.title} plan.`, // Provide a default description
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
        planName: plan.title, // ADDED: Pass planName to webhook via metadata
        creatorId: plan.userId, // ADDED: Pass creatorId to webhook via metadata
        amountPaid: amountInCents, // ADDED: Pass amountPaid (in cents) to webhook via metadata
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
      // eslint-disable-next-line no-console
      console.error("❌ Stripe purchase session creation error:", err);
    }
    // Provide a more user-friendly error in production, but full error for dev
    return res
      .status(500)
      .json({ success: false, error: `Failed to create checkout session: ${process.env.NODE_ENV !== "production" ? err.message : "Please try again later."}` });
  }
});

export default router;