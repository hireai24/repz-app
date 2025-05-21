import express from "express";
import {
  collection,
  getDocs,
  updateDoc,
  doc,
  where,
  query
} from "firebase/firestore";

import { db } from "../../backend/firebase/init.js";
import { verifyAdmin } from "../../backend/utils/authMiddleware.js";

const router = express.Router();

// GET /admin/dashboard/manage-users/reported
router.get("/reported", verifyAdmin, async (req, res) => {
  try {
    const q = query(collection(db, "users"), where("flagged", "==", true));
    const snapshot = await getDocs(q);

    const users = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    }));

    // TODO: Add pagination & filtering for large datasets

    if (process.env.NODE_ENV !== "production") {
      console.log(`[ADMIN] Retrieved ${users.length} reported users.`);
    }

    res.status(200).json({ success: true, users });
  } catch (err) {
    console.error("[manageUsers.js] Error fetching reported users:", err.message);
    res.status(500).json({ success: false, error: "Failed to fetch reported users." });
  }
});

// POST /admin/dashboard/manage-users/toggle-ban
router.post("/toggle-ban", verifyAdmin, async (req, res) => {
  const { userId, ban } = req.body;

  const isValidUserId = typeof userId === "string" && /^[a-zA-Z0-9_-]{10,}$/.test(userId);
  if (!isValidUserId) {
    return res.status(400).json({ success: false, error: "Invalid or missing userId." });
  }

  if (typeof ban !== "boolean") {
    return res.status(400).json({ success: false, error: "Invalid ban value. Must be boolean." });
  }

  try {
    const docRef = doc(db, "users", userId);
    await updateDoc(docRef, { banned: ban });

    if (process.env.NODE_ENV !== "production") {
      console.log(`[ADMIN] User ${userId} ${ban ? "banned" : "unbanned"} by ${req.user?.uid || "unknown admin"}`);
    }

    res.status(200).json({
      success: true,
      message: `User ${ban ? "banned" : "unbanned"} successfully.`
    });
  } catch (err) {
    console.error("[manageUsers.js] Error toggling user ban:", err.message);
    res.status(500).json({ success: false, error: "Failed to update user ban status." });
  }
});

export default router;
