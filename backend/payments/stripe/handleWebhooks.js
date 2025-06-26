import express from "express";
import Stripe from "stripe";
import { Timestamp } from "firebase-admin/firestore";
import { db } from "../../firebase/init.js";

const log = {
  info: () => {},
  warn: () => {},
  error: () => {},
  debug: () => {},
};

const router = express.Router();
const STRIPE_API_VERSION = "2023-10-16";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: STRIPE_API_VERSION,
});
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

if (!endpointSecret || !process.env.STRIPE_SECRET_KEY) {
  throw new Error("❌ Missing Stripe webhook or secret keys in environment variables.");
}

router.post("/", express.raw({ type: "application/json" }), async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    log.error && log.error("Stripe signature verification failed:", err.message);
    return res.status(400).json({ success: false, error: `Webhook Error: ${err.message}` });
  }

  const { type, data } = event;

  try {
    switch (type) {
      case "checkout.session.completed": {
        const session = data.object;
        const metadata = session.metadata || {};
        const mode = session.mode;

        if (mode === "subscription") {
          const userId = metadata.userId;
          let price, product, tier;

          if (
            session.line_items &&
            session.line_items.data &&
            session.line_items.data[0]
          ) {
            price = await stripe.prices.retrieve(session.line_items.data[0].price);
            product = await stripe.products.retrieve(price.product);
            tier = product.metadata?.tier || "Pro";
          } else {
            tier = "Pro";
          }

          if (!userId) {
            log.error && log.error("Missing userId in subscription metadata.");
            return res.status(200).json({ received: true, error: "Missing userId" });
          }

          await db.collection("users").doc(userId).update({
            tier,
            subscriptionActive: true,
            subscriptionStart: Timestamp.now(),
            stripeSubscriptionId: session.subscription,
          });

          log.info &&
            log.info(`Subscription activated for ${userId} (${tier}) via checkout.session.completed`);
        }

        if (mode === "payment") {
          const {
            userId: buyerId,
            planId,
            planName,
            creatorId,
            amountPaid: amountPaidRaw,
          } = metadata;
          const amountPaid = parseInt(amountPaidRaw, 10);
          const sessionId = session.id;
          const paymentIntentId = session.payment_intent;

          if (!buyerId || !planId || !planName || !creatorId || isNaN(amountPaid)) {
            log.error && log.error("Missing or invalid purchase metadata:", metadata);
            return res.status(200).json({ received: true, error: "Missing/invalid metadata" });
          }

          await db.collection("purchases").add({
            userId: buyerId,
            planId,
            planName,
            creatorId,
            amountPaid,
            sessionId,
            paymentIntentId,
            purchasedAt: Timestamp.now(),
          });

          log.info &&
            log.info(
              `Plan '${planName}' (${planId}) purchased by ${buyerId} for ${amountPaid / 100} (PI: ${paymentIntentId})`
            );
        }
        break;
      }

      case "customer.subscription.deleted":
      case "customer.subscription.updated": {
        const subscription = data.object;
        const userId = subscription.metadata?.userId;

        if (!userId) {
          log.warn && log.warn(`Missing userId in metadata for subscription ID: ${subscription.id}`);
          return res.status(200).json({ received: true, error: "Missing userId" });
        }

        const latestSubscription = await stripe.subscriptions.retrieve(subscription.id);
        const isActive = ["active", "trialing"].includes(latestSubscription.status);

        let newTier = "Free";
        if (isActive) {
          const priceId = latestSubscription.items.data[0].price.id;
          const price = await stripe.prices.retrieve(priceId);
          const product = await stripe.products.retrieve(price.product);
          newTier = product.metadata?.tier || "Pro";
        }

        await db.collection("users").doc(userId).update({
          subscriptionActive: isActive,
          tier: newTier,
          subscriptionEnd: isActive ? null : Timestamp.now(),
        });

        log.info &&
          log.info(`Subscription ${isActive ? "active" : "cancelled"} for ${userId}. New tier: ${newTier}.`);
        break;
      }

      default: {
        log.debug && log.debug(`Received unhandled event type: ${type}`);
      }
    }

    return res.status(200).json({ success: true, message: "Webhook processed successfully." });
  } catch (err) {
    log.error && log.error("Error processing webhook:", err);
    return res.status(200).json({
      success: false,
      error: `Internal webhook processing error: ${err.message || "Unknown error."}`,
    });
  }
});

export default router;
