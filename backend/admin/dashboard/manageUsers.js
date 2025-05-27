// backend/admin/dashboard/manageUsers.js

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

// GET /admin/dashboard/manage-users/reported
router.get("/reported", verifyAdmin, async (req, res) => {
  try {
    const q = query(collection(db, "users"), where("flagged", "==", true));
    const snapshot = await getDocs(q);

    const users = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.status(200).json({ success: true, users });
  } catch {
    res
      .status(500)
      .json({ success: false, error: "Failed to fetch reported users." });
  }
});

// POST /admin/dashboard/manage-users/toggle-ban
router.post("/toggle-ban", verifyAdmin, async (req, res) => {
  const { userId, ban } = req.body;

  const isValidUserId =
    typeof userId === "string" && /^[a-zA-Z0-9_-]{10,}$/.test(userId);
  if (!isValidUserId) {
    return res
      .status(400)
      .json({ success: false, error: "Invalid or missing userId." });
  }

  if (typeof ban !== "boolean") {
    return res
      .status(400)
      .json({ success: false, error: "Invalid ban value. Must be boolean." });
  }

  try {
    const docRef = doc(db, "users", userId);
    await updateDoc(docRef, { banned: ban });

    res.status(200).json({
      success: true,
      message: `User ${ban ? "banned" : "unbanned"} successfully.`,
    });
  } catch {
    res
      .status(500)
      .json({ success: false, error: "Failed to update user ban status." });
  }
});

export default router;
