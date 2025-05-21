import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
} from "firebase/firestore";

import { db } from "../firebase/init.js";
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
        createdAt: Timestamp.now(),
      };

      const docRef = await addDoc(collection(db, "mealPlans"), mealPlan);

      return res.status(200).json({ success: true, mealPlanId: docRef.id });
    } catch (err) {
      console.error("🔥 Error saving meal plan:", {
        message: err.message,
        stack: err.stack,
      });
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
      const plansRef = collection(db, "mealPlans");
      const q = query(
        plansRef,
        where("userId", "==", userId),
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
      console.error("🔥 Error fetching user meal plans:", {
        message: err.message,
        stack: err.stack,
      });
      return res.status(500).json({
        success: false,
        error: "Failed to fetch meal plans.",
      });
    }
  });
};

export { saveMealPlan, getUserMealPlans };
