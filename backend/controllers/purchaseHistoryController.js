// backend/controllers/purchaseHistoryController.js

import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  Timestamp,
} from "firebase/firestore";
import { db } from "../firebase/init.js";
import { verifyUser } from "../utils/authMiddleware.js";

/**
 * POST /api/purchases
 * Log a purchase with full audit trail.
 * This function should ideally be called by the Stripe webhook handler,
 * not directly by the frontend, to ensure all details are server-verified.
 * @param {Object} req.body - Contains purchase details
 * @param {string} req.body.userId - ID of the user who made the purchase
 * @param {string} req.body.planId - ID of the purchased plan
 * @param {string} req.body.planName - Name/title of the purchased plan (NEW)
 * @param {number} req.body.amountPaid - Amount paid for the plan (in cents)
 * @param {string} req.body.creatorId - ID of the plan's creator
 * @param {string} req.body.sessionId - Stripe Checkout Session ID
 * @param {string} [req.body.paymentIntentId] - Stripe Payment Intent ID (NEW: for more audit detail)
 */
export const logPurchase = async (req, res) => {
  // IMPORTANT: For production, this endpoint should primarily be secured for server-to-server calls
  // (e.g., from the Stripe webhook handler). If exposed directly to frontend, `verifyUser` is needed,
  // but `userId` should come from `req.user.uid` for security.
  // For the purpose of integrating with webhook, we'll allow it to be called without `verifyUser`
  // if it's explicitly called internally by `handleWebhooks.js`.
  // If `logPurchase` is intended for a frontend call, `verifyUser` and `req.user.uid` must be used.

  // Assuming this is primarily an internal/webhook-called function.
  // If called via the verified API route, req.user will be available.
  const authCallback = async () => {
    // If userId comes from req.user (from auth middleware), use it. Otherwise, rely on req.body (for webhook).
    const userId = req.user?.uid || req.body.userId;
    const { planId, planName, amountPaid, creatorId, sessionId, paymentIntentId } = req.body;

    if (!userId || !planId || !planName || !amountPaid || !creatorId || !sessionId) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields for purchase log.",
      });
    }

    try {
      await addDoc(collection(db, "purchases"), {
        userId,
        planId,
        planName, // ADDED: Store plan name
        creatorId,
        amountPaid, // Store in cents
        sessionId,
        paymentIntentId: paymentIntentId || null, // ADDED: Store Payment Intent ID
        purchasedAt: Timestamp.now(),
      });

      return res.status(200).json({ success: true, message: "Purchase logged successfully." });
    } catch (error) {
      console.error("Failed to log purchase:", error); // Log actual error for debugging
      return res.status(500).json({
        success: false,
        error: `Failed to log purchase: ${error.message || "Unknown error."}`,
      });
    }
  };

  // If verifyUser middleware is present, call it. Otherwise, execute directly (for internal/webhook calls).
  if (req.originalUrl.includes("/api/purchases") && typeof verifyUser === 'function') {
    await verifyUser(req, res, authCallback);
  } else {
    // This path is for internal calls or webhooks where `verifyUser` might not be applied directly
    // to the `logPurchase` function.
    await authCallback();
  }
};

/**
 * GET /api/purchases/:userId
 * Fetches purchase history for a user.
 * @param {Object} req.params.userId - User ID
 * @param {string} [req.query.startDate] - Optional start date filter (ISO string)
 * @param {string} [req.query.endDate] - Optional end date filter (ISO string)
 * @param {string} [req.query.export] - Optional export format (e.g., "json")
 */
export const getPurchaseHistory = async (req, res) => {
  await verifyUser(req, res, async () => {
    const { userId: paramUserId } = req.params;
    // Security check: Ensure the user requesting their history is the authenticated user.
    // Assuming `verifyUser` sets `req.user.uid`.
    if (!req.user || req.user.uid !== paramUserId) {
      return res.status(403).json({ success: false, error: "Unauthorized access to purchase history." });
    }

    const { startDate, endDate, export: exportFormat } = req.query;

    try {
      const purchaseRef = collection(db, "purchases");
      const q = query(purchaseRef, where("userId", "==", paramUserId));
      const snapshot = await getDocs(q);

      let purchases = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          planId: data.planId,
          planName: data.planName || "Unknown Plan", // Provide a default if not found (for old data)
          amount: (data.amountPaid / 100).toFixed(2), // Convert cents to currency for display (client often expects currency units)
          amountRaw: data.amountPaid, // Keep raw cents for audit if needed
          creatorId: data.creatorId,
          sessionId: data.sessionId,
          paymentIntentId: data.paymentIntentId, // Include if present
          purchasedAt: data.purchasedAt?.toDate ? data.purchasedAt.toDate().toISOString() : null, // Convert Timestamp to ISO string
        };
      });

      // Optional date filtering
      if (startDate || endDate) {
        const start = startDate ? new Date(startDate) : new Date("2000-01-01T00:00:00Z");
        const end = endDate ? new Date(endDate) : new Date();
        end.setHours(23, 59, 59, 999); // Include purchases up to the end of the end date

        purchases = purchases.filter((p) => {
          const date = p.purchasedAt ? new Date(p.purchasedAt) : null;
          return date && date >= start && date <= end;
        });
      }

      // Sort by date, newest first
      purchases.sort((a, b) => new Date(b.purchasedAt) - new Date(a.purchasedAt));


      // Optional export format
      if (exportFormat === "json") {
        res.setHeader(
          "Content-Disposition",
          "attachment; filename=purchases.json",
        );
        res.setHeader("Content-Type", "application/json");
        return res.status(200).send(JSON.stringify(purchases, null, 2));
      }

      return res.status(200).json({ success: true, purchases });
    } catch (error) {
      console.error("Error fetching user purchases:", error); // Log actual error for debugging
      return res.status(500).json({
        success: false,
        error: `Error fetching user purchases: ${error.message || "Unknown error."}`,
      });
    }
  });
};