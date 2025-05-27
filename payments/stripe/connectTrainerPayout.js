// payments/stripe/connectTrainerPayout.js

import express from "express";
import Stripe from "stripe";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "../../backend/firebase/init.js";

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

// Create Stripe Connect account and return onboarding link
router.post("/create", async (req, res) => {
  const { userId, email } = req.body;

  if (!userId || !email) {
    return res.status(400).json({ error: "Missing userId or email." });
  }

  try {
    const account = await stripe.accounts.create({
      type: "express",
      email,
      metadata: { userId },
      capabilities: {
        transfers: { requested: true },
      },
    });

    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, { stripeAccountId: account.id });

    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${process.env.FRONTEND_URL}/connect/refresh`,
      return_url: `${process.env.FRONTEND_URL}/connect/complete`,
      type: "account_onboarding",
    });

    return res.status(200).json({ url: accountLink.url });
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.error("Stripe Connect error:", err.message);
    }
    return res.status(500).json({ error: err.message });
  }
});

// Check account status (for dashboard display)
router.get("/status/:userId", async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json({ error: "Missing userId." });
  }

  try {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return res.status(404).json({ error: "User not found" });
    }

    const stripeAccountId = userSnap.data().stripeAccountId;
    if (!stripeAccountId) {
      return res.status(400).json({ error: "Stripe account not connected" });
    }

    const account = await stripe.accounts.retrieve(stripeAccountId);

    return res.status(200).json({
      charges_enabled: account.charges_enabled,
      payouts_enabled: account.payouts_enabled,
      details_submitted: account.details_submitted,
    });
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.error("Stripe account status error:", err.message);
    }
    return res.status(500).json({ error: err.message });
  }
});

export default router;
