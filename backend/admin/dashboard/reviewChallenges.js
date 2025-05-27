// backend/admin/dashboard/reviewChallenges.js

import express from "express";
import {
  collection,
  getDocs,
  updateDoc,
  doc,
  where,
  query,
} from "firebase/firestore";

import { db } from "../../firebase/init.js";
import { verifyAdmin } from "../../utils/authMiddleware.js";

const router = express.Router();

// GET /admin/dashboard/review-challenges/flagged
router.get("/flagged", verifyAdmin, async (req, res) => {
  try {
    const q = query(collection(db, "challenges"), where("flagged", "==", true));
    const snapshot = await getDocs(q);

    const flagged = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Pagination + filters: TODO for future

    res.status(200).json({ success: true, flagged });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, error: "Failed to fetch flagged challenges." });
  }
});

// POST /admin/dashboard/review-challenges/moderate
router.post("/moderate", verifyAdmin, async (req, res) => {
  const { challengeId, action } = req.body;

  const isValidId =
    typeof challengeId === "string" && /^[a-zA-Z0-9_-]{10,}$/.test(challengeId);
  const isValidAction = ["approve", "remove"].includes(action);

  if (!isValidId || !isValidAction) {
    return res.status(400).json({
      success: false,
      error: "Invalid or missing challengeId or action.",
    });
  }

  try {
    const docRef = doc(db, "challenges", challengeId);

    if (action === "remove") {
      await updateDoc(docRef, { removed: true, flagged: false });
    } else {
      await updateDoc(docRef, { flagged: false });
    }

    res.status(200).json({
      success: true,
      message: `Challenge ${action}d successfully.`,
    });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, error: "Failed to moderate challenge." });
  }
});

export default router;
