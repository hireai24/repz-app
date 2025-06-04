// backend/payments/stripe/connectTrainerPayout.js

import express from "express";
import Stripe from "stripe";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "../../firebase/init.js";
import { verifyUser } from "../../utils/authMiddleware.js"; // Import verifyUser

const router = express.Router();
const STRIPE_API_VERSION = "2023-10-16"; // Standardize API Version
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: STRIPE_API_VERSION,
});

// Create Stripe Connect account and return onboarding link
router.post("/create", verifyUser, async (req, res) => { // ADDED: verifyUser middleware
  const userId = req.user?.uid; // Get userId from authenticated user
  const email = req.user?.email; // Get email from authenticated user

  if (!userId || !email) {
    return res.status(401).json({ error: "Authentication required to create Stripe account." }); // Changed to 401
  }

  const FRONTEND_URL = process.env.FRONTEND_URL;
  if (!FRONTEND_URL || !/^https?:\/\/.+/.test(FRONTEND_URL)) {
    console.error("Invalid or missing FRONTEND_URL environment variable for Stripe Connect.");
    return res.status(500).json({
      error: "Server configuration error: Invalid FRONTEND_URL for Stripe Connect.",
    });
  }

  try {
    const account = await stripe.accounts.create({
      type: "express",
      email,
      metadata: { userId },
      capabilities: {
        transfers: { requested: true },
      },
      // Ensure business type is set if you need it, e.g., business_type: 'individual' or 'company'
      // You might also want to prefill some details like business_profile.url
    });

    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, { stripeAccountId: account.id });

    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${FRONTEND_URL}/connect/refresh`, // Using FRONTEND_URL
      return_url: `${FRONTEND_URL}/connect/complete`, // Using FRONTEND_URL
      type: "account_onboarding",
    });

    return res.status(200).json({ url: accountLink.url });
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.error("Stripe Connect create account error:", err.message, err.raw || err); // eslint-disable-line no-console
    }
    return res.status(500).json({ error: `Failed to create Stripe Connect account: ${process.env.NODE_ENV !== "production" ? err.message : "Please try again later."}` });
  }
});

// Check account status (for dashboard display)
router.get("/status/:userId", verifyUser, async (req, res) => { // ADDED: verifyUser middleware
  const paramUserId = req.params.userId;
  // Security check: Ensure the user requesting their status is the authenticated user.
  if (!req.user || req.user.uid !== paramUserId) {
    return res.status(403).json({ error: "Unauthorized access to Stripe account status." });
  }

  try {
    const userRef = doc(db, "users", paramUserId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return res.status(404).json({ error: "User not found." });
    }

    const stripeAccountId = userSnap.data().stripeAccountId;
    if (!stripeAccountId) {
      return res.status(400).json({ error: "Stripe account not connected for this user." });
    }

    const account = await stripe.accounts.retrieve(stripeAccountId);

    return res.status(200).json({
      charges_enabled: account.charges_enabled,
      payouts_enabled: account.payouts_enabled,
      details_submitted: account.details_submitted,
      // You might also want to return account.requirements.past_due or account.requirements.eventually_due
      // for more detailed UI feedback on pending requirements.
      requirements: account.requirements, // Include full requirements object for frontend to parse
    });
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.error("Stripe account status error:", err.message, err.raw || err); // eslint-disable-line no-console
    }
    return res.status(500).json({ error: `Failed to retrieve Stripe account status: ${process.env.NODE_ENV !== "production" ? err.message : "Please try again later."}` });
  }
});

export default router;