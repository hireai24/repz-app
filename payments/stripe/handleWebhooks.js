import express from "express";
import Stripe from "stripe";
import { doc, updateDoc, addDoc, collection } from "firebase/firestore";
import { db } from "../../backend/firebase/init.js";

const router = express.Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2022-11-15",
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
      return res
        .status(400)
        .json({ success: false, error: `Webhook Error: ${err.message}` });
    }

    const { type, data } = event;

    try {
      switch (type) {
        case "checkout.session.completed": {
          const metadata = data.object.metadata || {};
          const mode = data.object.mode;

          if (mode === "subscription") {
            const { userId, tier } = metadata;

            if (!userId)
              throw new Error("Missing userId in subscription metadata.");

            await updateDoc(doc(db, "users", userId), {
              tier: tier || "Pro",
              subscriptionActive: true,
              subscriptionStart: new Date().toISOString(),
            });

            if (process.env.NODE_ENV !== "production") {
              // eslint-disable-next-line no-console
              console.log(
                `✅ Subscription activated for ${userId} (${tier || "Pro"})`,
              );
            }
          }

          if (mode === "payment") {
            const { userId: buyerId, planId } = metadata;
            const amountPaid = data.object.amount_total / 100;
            const creatorId = data.object.transfer_data?.destination;
            const sessionId = data.object.id;

            if (!buyerId || !planId || !creatorId) {
              throw new Error("Missing purchase metadata for payment.");
            }

            await addDoc(collection(db, "purchases"), {
              userId: buyerId,
              planId,
              creatorId,
              amountPaid,
              sessionId,
              purchasedAt: new Date(),
            });

            if (process.env.NODE_ENV !== "production") {
              // eslint-disable-next-line no-console
              console.log(
                `✅ Plan ${planId} purchased by ${buyerId} for £${amountPaid}`,
              );
            }
          }

          break;
        }

        case "customer.subscription.deleted": {
          const userId = data.object.metadata?.userId;

          if (!userId) {
            if (process.env.NODE_ENV !== "production") {
              // eslint-disable-next-line no-console
              console.warn(
                "⚠️ Subscription cancellation webhook missing userId.",
              );
            }
            break;
          }

          await updateDoc(doc(db, "users", userId), {
            subscriptionActive: false,
            tier: "Free",
          });

          if (process.env.NODE_ENV !== "production") {
            // eslint-disable-next-line no-console
            console.log(`⚠️ Subscription cancelled for ${userId}`);
          }
          break;
        }

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
        console.error("🔥 Error processing webhook:", err.message);
      }
      return res.status(500).json({
        success: false,
        error: err.message || "Internal webhook error.",
      });
    }
  },
);

export default router;
