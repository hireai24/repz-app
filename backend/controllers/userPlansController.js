import { db } from "../firebase/init.js";
import { verifyUser } from "../utils/authMiddleware.js";

/**
 * Add a purchased plan to the user's plans (userPlans collection)
 */
const addUserPlan = async (req, res) => {
  await verifyUser(req, res, async (user) => {
    const { planId } = req.body;

    if (!planId) {
      return res.status(400).json({ success: false, error: "Missing planId." });
    }

    try {
      const planRef = db.collection("plans").doc(planId);
      const planSnap = await planRef.get();

      if (!planSnap.exists) {
        return res
          .status(404)
          .json({ success: false, error: "Plan not found." });
      }

      const planData = planSnap.data();

      await db.collection("userPlans").add({
        userId: user.uid,
        originalPlanId: planId,
        title: planData.title,
        type: planData.type,
        level: planData.level,
        durationWeeks: planData.durationWeeks,
        schedule: planData.schedule || [],
        createdAt: new Date(),
        isCompleted: false,
      });

      res.status(200).json({ success: true });
    } catch {
      res
        .status(500)
        .json({ success: false, error: "Failed to add user plan." });
    }
  });
};

/**
 * Get all plans a user owns (purchased or created)
 */
const getUserPlans = async (req, res) => {
  await verifyUser(req, res, async (user) => {
    try {
      const snapshot = await db
        .collection("userPlans")
        .where("userId", "==", user.uid)
        .orderBy("createdAt", "desc")
        .get();

      const plans = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      res.status(200).json({ success: true, plans });
    } catch {
      res
        .status(500)
        .json({ success: false, error: "Failed to fetch user plans." });
    }
  });
};

export { addUserPlan, getUserPlans };
