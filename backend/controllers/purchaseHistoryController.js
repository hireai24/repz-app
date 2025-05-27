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
 * Log a purchase with full audit trail
 */
const logPurchase = async (req, res) => {
  await verifyUser(req, res, async () => {
    const { userId, planId, amountPaid, creatorId, sessionId } = req.body;

    if (!userId || !planId || !amountPaid || !creatorId || !sessionId) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields",
      });
    }

    try {
      await addDoc(collection(db, "purchases"), {
        userId,
        planId,
        creatorId,
        amountPaid,
        sessionId,
        purchasedAt: Timestamp.now(),
      });

      return res.status(200).json({ success: true });
    } catch {
      return res.status(500).json({
        success: false,
        error: "Failed to log purchase.",
      });
    }
  });
};

/**
 * GET /api/purchases/:userId?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&export=json
 */
const getUserPurchases = async (req, res) => {
  await verifyUser(req, res, async () => {
    const { userId } = req.params;
    const { startDate, endDate, export: exportFormat } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "Missing userId",
      });
    }

    try {
      const purchaseRef = collection(db, "purchases");
      const q = query(purchaseRef, where("userId", "==", userId));
      const snapshot = await getDocs(q);

      let purchases = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Optional date filtering
      if (startDate || endDate) {
        const start = startDate ? new Date(startDate) : new Date("2000-01-01");
        const end = endDate ? new Date(endDate) : new Date();

        purchases = purchases.filter((p) => {
          const date =
            typeof p.purchasedAt?.toDate === "function"
              ? p.purchasedAt.toDate()
              : new Date(p.purchasedAt);
          return date >= start && date <= end;
        });
      }

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
    } catch {
      return res.status(500).json({
        success: false,
        error: "Error fetching user purchases.",
      });
    }
  });
};

export { logPurchase, getUserPurchases };
