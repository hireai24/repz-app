import { db } from "../firebase/init.js";
import admin from "firebase-admin";
import { verifyUser } from "../utils/authMiddleware.js";

const PAGE_SIZE = 20;

/**
 * Save a user's custom or AI-generated meal plan
 */
const saveMealPlan = async (req, res) => {
  await verifyUser(req, res, async () => {
    const { userId, goal, calories, macros, preferences, meals } = req.body;

    const isValid =
      userId &&
      typeof goal === "string" &&
      typeof calories === "number" &&
      macros &&
      typeof macros === "object" &&
      typeof macros.protein === "number" &&
      typeof macros.carbs === "number" &&
      typeof macros.fat === "number" &&
      Array.isArray(meals);

    if (!isValid) {
      return res.status(400).json({
        success: false,
        error: "Missing or invalid meal plan data",
      });
    }

    try {
      const mealPlan = {
        userId,
        goal,
        calories,
        macros,
        preferences: preferences || "",
        meals,
        createdAt: new Date(), // Admin SDK uses native Date
      };

      const docRef = await db.collection("mealPlans").add(mealPlan);

      return res.status(200).json({ success: true, mealPlanId: docRef.id });
    } catch (err) {
      return res.status(500).json({
        success: false,
        error: "Failed to save meal plan.",
      });
    }
  });
};

/**
 * Get all meal plans for a user, newest first, paginated
 * Query param: ?limit=20 (optional)
 */
const getUserMealPlans = async (req, res) => {
  await verifyUser(req, res, async () => {
    const { userId } = req.params;
    const limitCount = parseInt(req.query.limit, 10) || PAGE_SIZE;

    if (!userId || typeof userId !== "string") {
      return res.status(400).json({
        success: false,
        error: "Missing or invalid userId in request",
      });
    }

    try {
      const snapshot = await db
        .collection("mealPlans")
        .where("userId", "==", userId)
        .orderBy("createdAt", "desc")
        .limit(limitCount)
        .get();

      const plans = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      return res.status(200).json({ success: true, plans });
    } catch (err) {
      return res.status(500).json({
        success: false,
        error: "Failed to fetch meal plans.",
      });
    }
  });
};

export { saveMealPlan, getUserMealPlans };
