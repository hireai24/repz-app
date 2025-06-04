import express from "express";
import Stripe from "stripe";
import { doc, updateDoc, addDoc, collection, Timestamp } from "firebase/firestore"; // ADDED Timestamp
import { db } from "../../firebase/init.js";

const router = express.Router();

const STRIPE_API_VERSION = "2023-10-16"; // Standardize API Version
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: STRIPE_API_VERSION,
});
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

if (!endpointSecret || !process.env.STRIPE_SECRET_KEY) {
  throw new Error(
    "❌ Missing Stripe webhook or secret keys in environment variables.",
  );
}

// Stripe requires the raw body for webhook verification
router.post(
  "/",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];
    let event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
      if (process.env.NODE_ENV !== "production") {
        // eslint-disable-next-line no-console
        console.error("❌ Stripe signature verification failed:", err.message);
      }
      // Return 400 for signature verification failure (Stripe won't retry invalid signature)
      return res
        .status(400)
        .json({ success: false, error: `Webhook Error: ${err.message}` });
    }

    const { type, data } = event;

    try {
      switch (type) {
        case "checkout.session.completed": {
          const session = data.object;
          const metadata = session.metadata || {};
          const mode = session.mode;

          if (mode === "subscription") {
            const { userId } = metadata; // Assuming tier is associated with the price or derived in app logic

            // Retrieve the Price object to get product details, including tier
            const price = await stripe.prices.retrieve(session.line_items.data[0].price);
            const product = await stripe.products.retrieve(price.product);
            const tier = product.metadata?.tier || "Pro"; // Assume product metadata contains tier

            if (!userId) {
              console.error("Missing userId in subscription metadata for checkout.session.completed.");
              return res.status(200).json({ received: true, error: "Missing userId" }); // Don't return 500
            }

            await updateDoc(doc(db, "users", userId), {
              tier: tier, // Use derived tier
              subscriptionActive: true,
              subscriptionStart: Timestamp.now(), // Use Timestamp.now()
              stripeSubscriptionId: session.subscription, // Store subscription ID for future management
            });

            if (process.env.NODE_ENV !== "production") {
              // eslint-disable-next-line no-console
              console.log(
                `✅ Subscription activated for ${userId} (${tier}) via checkout.session.completed`,
              );
            }
          }

          if (mode === "payment") {
            const { userId: buyerId, planId, planName, creatorId, amountPaid: amountPaidRaw } = metadata; // Now getting planName, creatorId, amountPaid from metadata
            const amountPaid = parseInt(amountPaidRaw, 10); // Ensure amountPaid is an integer (in cents)
            const sessionId = session.id;
            const paymentIntentId = session.payment_intent; // Get the Payment Intent ID

            if (!buyerId || !planId || !planName || !creatorId || isNaN(amountPaid)) {
              console.error("Missing or invalid purchase metadata for payment in checkout.session.completed:", metadata);
              return res.status(200).json({ received: true, error: "Missing/invalid metadata" }); // Don't return 500
            }

            await addDoc(collection(db, "purchases"), {
              userId: buyerId,
              planId,
              planName, // ADDED: Store planName
              creatorId,
              amountPaid, // Store in cents
              sessionId,
              paymentIntentId, // ADDED: Store Payment Intent ID
              purchasedAt: Timestamp.now(), // Use Timestamp.now()
            });

            if (process.env.NODE_ENV !== "production") {
              // eslint-disable-next-line no-console
              console.log(
                `✅ Plan '${planName}' (${planId}) purchased by ${buyerId} for ${amountPaid / 100} (PI: ${paymentIntentId})`,
              );
            }
          }

          break;
        }

        case "customer.subscription.deleted":
        case "customer.subscription.updated": // Also listen for updates to handle plan downgrades/cancellations
          const subscription = data.object;
          const userId = subscription.metadata?.userId; // Assuming userId is always in subscription metadata

          if (!userId) {
            if (process.env.NODE_ENV !== "production") {
              // eslint-disable-next-line no-console
              console.warn(
                `⚠️ Subscription event (${type}) webhook missing userId in metadata for subscription ID: ${subscription.id}.`,
              );
            }
            return res.status(200).json({ received: true, error: "Missing userId" }); // Don't return 500
          }

          // Fetch the latest status of the subscription
          const latestSubscription = await stripe.subscriptions.retrieve(subscription.id);
          const isActive = latestSubscription.status === 'active' || latestSubscription.status === 'trialing';

          let newTier = "Free"; // Default to Free
          if (isActive) {
            // If active, try to determine the current product/tier
            const priceId = latestSubscription.items.data[0].price.id;
            const price = await stripe.prices.retrieve(priceId);
            const product = await stripe.products.retrieve(price.product);
            newTier = product.metadata?.tier || "Pro"; // Assume product metadata contains tier
          }

          await updateDoc(doc(db, "users", userId), {
            subscriptionActive: isActive,
            tier: newTier,
            subscriptionEnd: isActive ? null : Timestamp.now(), // Set end date if cancelled
          });

          if (process.env.NODE_ENV !== "production") {
            // eslint-disable-next-line no-console
            console.log(
              `⚠️ Subscription ${isActive ? 'active' : 'cancelled'} for ${userId}. New tier: ${newTier}.`,
            );
          }
          break;

        default:
          if (process.env.NODE_ENV !== "production") {
            // eslint-disable-next-line no-console
            console.log(`⚙️ Received unhandled event type: ${type}`);
          }
      }

      return res
        .status(200)
        .json({ success: true, message: "✅ Webhook processed successfully." });
    } catch (err) {
      if (process.env.NODE_ENV !== "production") {
        // eslint-disable-next-line no-console
        console.error("🔥 Error processing webhook:", err); // Log full error object
      }
      // Always return 200 to Stripe to prevent repeated retries for internal processing errors.
      return res.status(200).json({
        success: false,
        error: `Internal webhook processing error: ${err.message || "Unknown error."}`,
      });
    }
  },
);

export default router;