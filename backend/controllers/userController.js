import {
  doc,
  getDoc,
  setDoc,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  collection,
} from "firebase/firestore";
import fetch from "node-fetch";

import { db } from "../firebase/init.js";
import { verifyUser } from "../utils/authMiddleware.js";

const REVENUECAT_API_URL = "https://api.revenuecat.com/v1/subscribers";
const REVENUECAT_SECRET = process.env.REVENUECAT_WEBHOOK_SECRET;
const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY;

/**
 * Create or update user profile
 */
const upsertUserProfile = async (req, res) => {
  await verifyUser(req, res, async () => {
    const {
      userId,
      username,
      gym,
      goal,
      tier,
      profileImage,
      profilePicture,
      avatar,
      bestLifts,
      stats,
    } = req.body;

    if (
      typeof userId !== "string" ||
      typeof username !== "string" ||
      typeof gym !== "string"
    ) {
      return res
        .status(400)
        .json({ success: false, error: "Missing or invalid required fields." });
    }

    try {
      const userRef = doc(db, "users", userId);

      const profile = {
        username: username.trim(),
        gym: gym.trim(),
        goal: goal || "",
        tier: tier || "Free",
        profileImage: profileImage || null,
        profilePicture:
          typeof profilePicture === "string" ? profilePicture : null,
        avatar: typeof avatar === "number" ? avatar : null,
        bestLifts: Array.isArray(bestLifts) ? bestLifts : [],
        stats: typeof stats === "object" && stats !== null ? stats : {},
        updatedAt: new Date(),
      };

      if (profile.profilePicture) profile.avatar = null;
      if (typeof profile.avatar === "number") profile.profilePicture = null;

      await setDoc(userRef, profile, { merge: true });
      res.status(200).json({ success: true });
    } catch (err) {
      // TODO: Replace with logging utility
      res.status(500).json({ success: false, error: err.message });
    }
  });
};

/**
 * Get a single user profile by ID
 */
const getUserProfile = async (req, res) => {
  await verifyUser(req, res, async () => {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ success: false, error: "Missing userId" });
    }

    try {
      const docRef = doc(db, "users", userId);
      const snapshot = await getDoc(docRef);

      if (!snapshot.exists()) {
        return res
          .status(404)
          .json({ success: false, error: "User not found" });
      }

      const data = snapshot.data();

      res.status(200).json({
        success: true,
        user: {
          ...data,
          profileImage: data.profileImage || "",
          avatar: typeof data.avatar === "number" ? data.avatar : null,
          profilePicture: data.profilePicture || "",
        },
      });
    } catch (err) {
      // TODO: Replace with logging utility
      res.status(500).json({ success: false, error: err.message });
    }
  });
};

/**
 * Upload a transformation progress photo
 */
const uploadProgressPhoto = async (req, res) => {
  await verifyUser(req, res, async () => {
    const { userId, imageUrl, view } = req.body;

    if (
      typeof userId !== "string" ||
      typeof imageUrl !== "string" ||
      typeof view !== "string"
    ) {
      return res
        .status(400)
        .json({ success: false, error: "Missing or invalid required fields" });
    }

    try {
      const docRef = await addDoc(collection(db, "progressPhotos"), {
        userId,
        imageUrl,
        view,
        createdAt: new Date(),
      });

      res.status(200).json({ success: true, photoId: docRef.id });
    } catch (err) {
      // TODO: Replace with logging utility
      res.status(500).json({ success: false, error: err.message });
    }
  });
};

/**
 * Get all user transformation progress photos
 */
const getProgressPhotos = async (req, res) => {
  await verifyUser(req, res, async () => {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ success: false, error: "Missing userId" });
    }

    try {
      const q = query(
        collection(db, "progressPhotos"),
        where("userId", "==", userId),
        orderBy("createdAt", "asc"),
      );

      const snapshot = await getDocs(q);
      const photos = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      res.status(200).json({ success: true, photos });
    } catch (err) {
      // TODO: Replace with logging utility
      res.status(500).json({ success: false, error: err.message });
    }
  });
};

/**
 * Check RevenueCat subscription entitlements
 */
const checkEntitlements = async (req, res) => {
  await verifyUser(req, res, async () => {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ success: false, error: "Missing userId" });
    }

    try {
      const response = await fetch(`${REVENUECAT_API_URL}/${userId}`, {
        headers: {
          Authorization: `Bearer ${REVENUECAT_SECRET}`,
        },
      });

      if (!response.ok) {
        return res
          .status(400)
          .json({ success: false, error: "Failed to fetch entitlements" });
      }

      const data = await response.json();
      const entitlements = data.subscriber.entitlements || {};

      const access = {
        pro: !!entitlements.pro_access,
        elite: !!entitlements.elite_access,
      };

      res.status(200).json({ success: true, access });
    } catch (err) {
      // TODO: Replace with logging utility
      res.status(500).json({ success: false, error: err.message });
    }
  });
};

/**
 * Send password reset via Firebase Identity Toolkit API
 */
const resetPassword = async (req, res) => {
  const { email } = req.body;

  if (!email || typeof email !== "string") {
    return res
      .status(400)
      .json({ success: false, error: "Missing or invalid email" });
  }

  try {
    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${FIREBASE_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestType: "PASSWORD_RESET", email }),
      },
    );

    if (!response.ok) {
      throw new Error("Failed to send reset email");
    }

    res.status(200).json({ success: true });
  } catch (err) {
    // TODO: Replace with logging utility
    res.status(500).json({ success: false, error: err.message });
  }
};

export {
  upsertUserProfile,
  getUserProfile,
  uploadProgressPhoto,
  getProgressPhotos,
  checkEntitlements,
  resetPassword,
};
