import { Timestamp } from "firebase-admin/firestore"; // ✅ Only valid named import
import { db } from "../firebase/init.js";
import { verifyUser } from "../utils/authMiddleware.js";

/**
 * Save a new user-owned plan (AI-generated, purchased, or uploaded).
 * Fields: userId (server-attached), name, type, exercises, createdAt, source
 */
const saveUserPlan = async (req, res) => {
  const { name, type, exercises, createdAt, source = "manual" } = req.body;
  const userId = req.user?.uid; // Always trust server-authenticated userId

  if (
    !userId ||
    typeof userId !== "string" ||
    !name ||
    typeof name !== "string" ||
    !type ||
    typeof type !== "string" ||
    !Array.isArray(exercises)
  ) {
    return res.status(400).json({
      success: false,
      error:
        "Missing or invalid fields: userId, name, type, and exercises are required.",
    });
  }

  for (let i = 0; i < exercises.length; i++) {
    const ex = exercises[i];
    if (!ex || typeof ex.name !== "string" || !Array.isArray(ex.sets)) {
      return res.status(400).json({
        success: false,
        error: `Exercise at index ${i} is invalid. Each must include a 'name' (string) and 'sets' (array).`,
      });
    }
  }

  try {
    const docRef = await db.collection("userPlans").add({
      userId,
      name,
      type,
      source,
      exercises,
      createdAt: createdAt ? new Date(createdAt) : Timestamp.now(),
    });

    return res.status(200).json({
      success: true,
      planId: docRef.id,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message || "Unknown error saving user plan.",
    });
  }
};

// ✅ Export with middleware
export default [verifyUser, saveUserPlan];
