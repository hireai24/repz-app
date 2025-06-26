import { db, admin } from "../firebase/init.js";
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
        createdAt: new Date(),
      };

      const docRef = await db.collection("plans").add(planData);
      return res.status(200).json({ success: true, planId: docRef.id });
    } catch {
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
    const snapshot = await db
      .collection("plans")
      .where("isPublic", "==", true)
      .orderBy("createdAt", "desc")
      .limit(limitCount)
      .get();

    const plans = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return res.status(200).json({ success: true, plans });
  } catch {
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
    const docRef = db.collection("plans").doc(planId);
    const snapshot = await docRef.get();

    if (!snapshot.exists) {
      return res.status(404).json({ success: false, error: "Plan not found." });
    }

    return res.status(200).json({
      success: true,
      plan: { id: snapshot.id, ...snapshot.data() },
    });
  } catch {
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
      const docRef = db.collection("plans").doc(planId);
      const planSnap = await docRef.get();

      if (!planSnap.exists) {
        return res
          .status(404)
          .json({ success: false, error: "Plan not found." });
      }

      const planData = planSnap.data();
      if (planData.userId !== user.uid && user.role !== "admin") {
        return res
          .status(403)
          .json({ success: false, error: "Unauthorized to edit this plan." });
      }

      await docRef.update(updates);
      return res.status(200).json({ success: true });
    } catch {
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
      const docRef = db.collection("plans").doc(planId);
      const planSnap = await docRef.get();

      if (!planSnap.exists) {
        return res.status(404).json({
          success: false,
          error: "Plan not found.",
        });
      }

      await docRef.delete();
      return res.status(200).json({ success: true });
    } catch {
      return res.status(500).json({
        success: false,
        error: "Failed to delete plan.",
      });
    }
  });
};

export { uploadPlan, getMarketplacePlans, getPlanById, updatePlan, deletePlan };
