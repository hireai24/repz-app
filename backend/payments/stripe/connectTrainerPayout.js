import express from "express";
import Stripe from "stripe";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "../../firebase/init.js";
import { verifyUser } from "../../utils/authMiddleware.js";

const router = express.Router();
const STRIPE_API_VERSION = "2023-10-16";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: STRIPE_API_VERSION,
});

// Create Stripe Connect account and return onboarding link
router.post("/create", verifyUser, async (req, res) => {
  const userId = req.user?.uid;
  const email = req.user?.email;

  if (!userId || !email) {
    return res
      .status(401)
      .json({ error: "Authentication required to create Stripe account." });
  }

  const FRONTEND_URL = process.env.FRONTEND_URL;
  if (!FRONTEND_URL || !/^https?:\/\/.+/.test(FRONTEND_URL)) {
    // eslint-disable-next-line no-console
    console.error(
      "Invalid or missing FRONTEND_URL environment variable for Stripe Connect.",
    );
    return res.status(500).json({
      error:
        "Server configuration error: Invalid FRONTEND_URL for Stripe Connect.",
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
    });

    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, { stripeAccountId: account.id });

    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${FRONTEND_URL}/connect/refresh`,
      return_url: `${FRONTEND_URL}/connect/complete`,
      type: "account_onboarding",
    });

    return res.status(200).json({ url: accountLink.url });
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.error(
        "Stripe Connect create account error:",
        err.message,
        err.raw || err,
      );
    }
    return res.status(500).json({
      error: `Failed to create Stripe Connect account: ${process.env.NODE_ENV !== "production" ? err.message : "Please try again later."}`,
    });
  }
});

// Check account status (for dashboard display)
router.get("/status/:userId", verifyUser, async (req, res) => {
  const paramUserId = req.params.userId;
  if (!req.user || req.user.uid !== paramUserId) {
    return res
      .status(403)
      .json({ error: "Unauthorized access to Stripe account status." });
  }

  try {
    const userRef = doc(db, "users", paramUserId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return res.status(404).json({ error: "User not found." });
    }

    const stripeAccountId = userSnap.data().stripeAccountId;
    if (!stripeAccountId) {
      return res
        .status(400)
        .json({ error: "Stripe account not connected for this user." });
    }

    const account = await stripe.accounts.retrieve(stripeAccountId);

    return res.status(200).json({
      charges_enabled: account.charges_enabled,
      payouts_enabled: account.payouts_enabled,
      details_submitted: account.details_submitted,
      requirements: account.requirements,
    });
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.error(
        "Stripe account status error:",
        err.message,
        err.raw || err,
      );
    }
    return res.status(500).json({
      error: `Failed to retrieve Stripe account status: ${process.env.NODE_ENV !== "production" ? err.message : "Please try again later."}`,
    });
  }
});

export default router;
