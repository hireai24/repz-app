import {
  collection,
  addDoc,
  getDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
} from "firebase/firestore";

import { db } from "../firebase/init.js";
import { verifyUser, verifyAdmin } from "../utils/authMiddleware.js";

const PAGE_SIZE = 20;

/**
 * Upload a custom workout/meal/bundle plan to Firestore
 */
const uploadPlan = async (req, res) => {
  await verifyUser(req, res, async (user) => {
    const {
      title,
      description,
      type,
      durationWeeks,
      level,
      price,
      tags,
      schedule,
      mediaUrl,
      tier,
      isPublic,
    } = req.body;

    const isValid =
      typeof title === "string" &&
      typeof description === "string" &&
      typeof type === "string" &&
      typeof durationWeeks === "number" &&
      typeof level === "string" &&
      typeof price === "number" &&
      Array.isArray(tags) &&
      typeof schedule === "object" &&
      typeof tier === "string";

    if (!isValid || price < 0 || price > 500) {
      return res.status(400).json({
        success: false,
        error: "Invalid or missing input fields.",
      });
    }

    try {
      const planData = {
        userId: user.uid,
        title,
        description,
        type,
        durationWeeks,
        level,
        price,
        tags,
        schedule,
        mediaUrl: mediaUrl || "",
        tier,
        isPublic: !!isPublic,
        createdAt: Timestamp.now(),
      };

      const docRef = await addDoc(collection(db, "plans"), planData);
      return res.status(200).json({ success: true, planId: docRef.id });
    } catch (err) {
      console.error("🔥 Error uploading plan:", {
        message: err.message,
        stack: err.stack,
      });
      return res.status(500).json({
        success: false,
        error: "Failed to upload plan.",
      });
    }
  });
};

/**
 * Get all public marketplace plans (paginated)
 * Query param: ?limit=10
 */
const getMarketplacePlans = async (req, res) => {
  const limitCount = parseInt(req.query.limit, 10) || PAGE_SIZE;

  try {
    const plansRef = collection(db, "plans");
    const q = query(
      plansRef,
      where("isPublic", "==", true),
      orderBy("createdAt", "desc"),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);
    const plans = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return res.status(200).json({ success: true, plans });
  } catch (err) {
    console.error("🔥 Error fetching marketplace plans:", {
      message: err.message,
      stack: err.stack,
    });
    return res.status(500).json({
      success: false,
      error: "Failed to fetch marketplace plans.",
    });
  }
};

/**
 * Get a single plan by ID
 */
const getPlanById = async (req, res) => {
  const { planId } = req.params;

  if (!planId || typeof planId !== "string") {
    return res.status(400).json({
      success: false,
      error: "Missing or invalid planId.",
    });
  }

  try {
    const docRef = doc(db, "plans", planId);
    const snapshot = await getDoc(docRef);

    if (!snapshot.exists()) {
      return res.status(404).json({ success: false, error: "Plan not found." });
    }

    return res.status(200).json({
      success: true,
      plan: { id: snapshot.id, ...snapshot.data() },
    });
  } catch (err) {
    console.error("🔥 Error fetching plan by ID:", {
      message: err.message,
      stack: err.stack,
    });
    return res.status(500).json({
      success: false,
      error: "Failed to fetch plan.",
    });
  }
};

/**
 * Update an existing plan with ownership validation
 */
const updatePlan = async (req, res) => {
  await verifyUser(req, res, async (user) => {
    const { planId } = req.params;
    const updates = req.body;

    if (!planId || typeof updates !== "object" || Array.isArray(updates)) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid update input." });
    }

    try {
      const docRef = doc(db, "plans", planId);
      const planSnap = await getDoc(docRef);

      if (!planSnap.exists()) {
        return res.status(404).json({ success: false, error: "Plan not found." });
      }

      const planData = planSnap.data();
      if (planData.userId !== user.uid && user.role !== "admin") {
        return res
          .status(403)
          .json({ success: false, error: "Unauthorized to edit this plan." });
      }

      await updateDoc(docRef, updates);
      return res.status(200).json({ success: true });
    } catch (err) {
      console.error("🔥 Error updating plan:", {
        message: err.message,
        stack: err.stack,
      });
      return res.status(500).json({
        success: false,
        error: "Failed to update plan.",
      });
    }
  });
};

/**
 * Delete a plan (admin only)
 */
const deletePlan = async (req, res) => {
  await verifyAdmin(req, res, async () => {
    const { planId } = req.params;

    if (!planId || typeof planId !== "string") {
      return res.status(400).json({
        success: false,
        error: "Missing or invalid planId.",
      });
    }

    try {
      const docRef = doc(db, "plans", planId);
      const planSnap = await getDoc(docRef);

      if (!planSnap.exists()) {
        return res.status(404).json({
          success: false,
          error: "Plan not found.",
        });
      }

      await deleteDoc(docRef);
      return res.status(200).json({ success: true });
    } catch (err) {
      console.error("🔥 Error deleting plan:", {
        message: err.message,
        stack: err.stack,
      });
      return res.status(500).json({
        success: false,
        error: "Failed to delete plan.",
      });
    }
  });
};

export {
  uploadPlan,
  getMarketplacePlans,
  getPlanById,
  updatePlan,
  deletePlan,
};
