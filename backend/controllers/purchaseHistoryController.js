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
 */
export const logPurchase = async (req, res) => {
  const authCallback = async () => {
    const userId = req.user?.uid || req.body.userId;
    const {
      planId,
      planName,
      amountPaid,
      creatorId,
      sessionId,
      paymentIntentId,
    } = req.body;

    if (
      !userId ||
      !planId ||
      !planName ||
      !amountPaid ||
      !creatorId ||
      !sessionId
    ) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields for purchase log.",
      });
    }

    try {
      await addDoc(collection(db, "purchases"), {
        userId,
        planId,
        planName,
        creatorId,
        amountPaid,
        sessionId,
        paymentIntentId: paymentIntentId || null,
        purchasedAt: Timestamp.now(),
      });

      return res
        .status(200)
        .json({ success: true, message: "Purchase logged successfully." });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Failed to log purchase:", error);
      return res.status(500).json({
        success: false,
        error: `Failed to log purchase: ${error.message || "Unknown error."}`,
      });
    }
  };

  if (
    req.originalUrl.includes("/api/purchases") &&
    typeof verifyUser === "function"
  ) {
    await verifyUser(req, res, authCallback);
  } else {
    await authCallback();
  }
};

/**
 * GET /api/purchases/:userId
 */
export const getPurchaseHistory = async (req, res) => {
  await verifyUser(req, res, async () => {
    const { userId: paramUserId } = req.params;
    if (!req.user || req.user.uid !== paramUserId) {
      return res.status(403).json({
        success: false,
        error: "Unauthorized access to purchase history.",
      });
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
          planName: data.planName || "Unknown Plan",
          amount: (data.amountPaid / 100).toFixed(2),
          amountRaw: data.amountPaid,
          creatorId: data.creatorId,
          sessionId: data.sessionId,
          paymentIntentId: data.paymentIntentId,
          purchasedAt: data.purchasedAt?.toDate
            ? data.purchasedAt.toDate().toISOString()
            : null,
        };
      });

      if (startDate || endDate) {
        const start = startDate
          ? new Date(startDate)
          : new Date("2000-01-01T00:00:00Z");
        const end = endDate ? new Date(endDate) : new Date();
        end.setHours(23, 59, 59, 999);
        purchases = purchases.filter((p) => {
          const date = p.purchasedAt ? new Date(p.purchasedAt) : null;
          return date && date >= start && date <= end;
        });
      }

      purchases.sort(
        (a, b) => new Date(b.purchasedAt) - new Date(a.purchasedAt),
      );

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
      // eslint-disable-next-line no-console
      console.error("Error fetching user purchases:", error);
      return res.status(500).json({
        success: false,
        error: `Error fetching user purchases: ${error.message || "Unknown error."}`,
      });
    }
  });
};
