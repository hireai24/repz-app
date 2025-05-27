// backend/admin/dashboard/highlightPlans.js

import express from "express";
import {
  collection,
  getDocs,
  updateDoc,
  doc,
  where,
  query,
  limit,
} from "firebase/firestore";

import { db } from "../../firebase/init.js";
import { verifyAdmin } from "../../utils/authMiddleware.js";

const router = express.Router();

// GET /admin/dashboard/highlight-plans/top
router.get("/top", verifyAdmin, async (req, res) => {
  try {
    const plansRef = collection(db, "plans");
    const q = query(plansRef, where("isPublic", "==", true), limit(20));
    const snapshot = await getDocs(q);

    const topPlans = snapshot.docs
      .map((docItem) => ({ id: docItem.id, ...docItem.data() }))
      .filter((p) => p.sales >= 5 || p.rating >= 4.5)
      .sort((a, b) => b.sales + b.rating - (a.sales + a.rating))
      .slice(0, 10);

    res.status(200).json({ success: true, topPlans });
  } catch {
    res
      .status(500)
      .json({ success: false, error: "Failed to fetch top plans." });
  }
});

// POST /admin/dashboard/highlight-plans/feature
router.post("/feature", verifyAdmin, async (req, res) => {
  const { planId } = req.body;

  const isValidId =
    typeof planId === "string" && /^[a-zA-Z0-9_-]{10,}$/.test(planId);
  if (!isValidId) {
    return res
      .status(400)
      .json({ success: false, error: "Invalid or missing planId." });
  }

  try {
    const planRef = doc(db, "plans", planId);
    await updateDoc(planRef, { featured: true });

    res
      .status(200)
      .json({ success: true, message: "Plan featured successfully." });
  } catch {
    res.status(500).json({ success: false, error: "Failed to feature plan." });
  }
});

export default router;
