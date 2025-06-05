// backend/controllers/userController.js

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
  deleteDoc, // Make sure deleteDoc is explicitly imported if used
} from "firebase/firestore";
import fetch from "node-fetch";
import Stripe from "stripe";

import { db } from "../firebase/init.js";
import { verifyUser } from "../utils/authMiddleware.js";

const REVENUECAT_API_URL = "https://api.revenuecat.com/v1/subscribers";
const REVENUECAT_SECRET = process.env.REVENUECAT_WEBHOOK_SECRET;
const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY;
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const FRONTEND_URL = process.env.FRONTEND_URL; // <-- Make sure this is set in your .env

const stripe = new Stripe(STRIPE_SECRET_KEY);

/**
 * Create or update user profile
 */
const updateUserById = async (req, res) => {
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
    } catch (error) {
      // Catch the error to potentially log it more granularly if needed later
      res
        .status(500)
        .json({ success: false, error: "Failed to update profile." });
    }
  });
};

/**
 * Get user profile by ID
 */
const getUserById = async (req, res) => {
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
    } catch (error) {
      // Catch the error
      res.status(500).json({ success: false, error: "Failed to get profile." });
    }
  });
};

/**
 * Delete user profile
 */
const deleteUserById = async (req, res) => {
  await verifyUser(req, res, async () => {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ success: false, error: "Missing userId" });
    }

    try {
      await deleteDoc(doc(db, "users", userId));
      res.status(200).json({ success: true, message: "User deleted" });
    } catch (error) {
      // Catch the error
      res.status(500).json({ success: false, error: "Failed to delete user." });
    }
  });
};

/**
 * Upload transformation progress photo
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
    } catch (error) {
      // Catch the error
      res
        .status(500)
        .json({ success: false, error: "Failed to upload photo." });
    }
  });
};

/**
 * Get user progress photos
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
    } catch (error) {
      // Catch the error
      res
        .status(500)
        .json({ success: false, error: "Failed to fetch photos." });
    }
  });
};

/**
 * Reset password using Firebase Identity Toolkit
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
  } catch (error) {
    // Catch the error
    res
      .status(500)
      .json({ success: false, error: "Failed to send reset email." });
  }
};

/**
 * Get RevenueCat entitlements
 */
const getUserEntitlements = async (req, res) => {
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
    } catch (error) {
      // Catch the error
      res
        .status(500)
        .json({ success: false, error: "Failed to check entitlements." });
    }
  });
};

/**
 * Get Stripe onboarding link (REAL)
 */
const getStripeOnboardingLink = async (req, res) => {
  await verifyUser(req, res, async () => {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ success: false, error: "Missing userId" });
    }

    try {
      // Create a Stripe account if you don’t already have one for this user
      const account = await stripe.accounts.create({
        type: "express",
        metadata: { userId },
      });

      // Generate onboarding link with ENV URLs (not hardcoded!)
      const accountLink = await stripe.accountLinks.create({
        account: account.id,
        refresh_url: `${FRONTEND_URL}/stripe/refresh`,
        return_url: `${FRONTEND_URL}/stripe/complete`,
        type: "account_onboarding",
      });

      res.status(200).json({ success: true, link: accountLink.url });
    } catch (err) {
      res.status(500).json({
        success: false,
        error: "Failed to get Stripe onboarding link.",
      });
    }
  });
};

export {
  getUserById,
  updateUserById,
  deleteUserById,
  uploadProgressPhoto,
  getProgressPhotos,
  resetPassword,
  getUserEntitlements,
  getStripeOnboardingLink,
};
