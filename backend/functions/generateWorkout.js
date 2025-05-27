// backend/functions/generateWorkout.js

import { collection, addDoc } from "firebase/firestore";

import { db } from "../firebase/init.js";
import { parseAIWorkoutPlan } from "../utils/planUtils.js";
import { generateWorkoutPlan } from "../ai/prompts/workoutPlanner.js";

/**
 * Generates and saves a structured workout plan tied to the user.
 * @param {string} userId - Firebase user ID
 * @param {Object} data - User input: goal, days, injuries, equipment, etc.
 * @returns {Object} - { success, planId, workoutPlan }
 */
const generateWorkout = async (
  userId,
  {
    goal,
    availableDays,
    injuries = "",
    equipment = "",
    preferredSplit = "",
    experienceLevel = "",
  },
) => {
  if (
    !userId ||
    typeof userId !== "string" ||
    !goal ||
    typeof goal !== "string" ||
    typeof availableDays !== "number" ||
    availableDays < 1 ||
    typeof injuries !== "string" ||
    typeof equipment !== "string" ||
    typeof preferredSplit !== "string" ||
    typeof experienceLevel !== "string"
  ) {
    return {
      success: false,
      error:
        "Invalid input. Ensure userId, goal, availableDays, and experienceLevel are valid.",
    };
  }

  try {
    const aiTimeoutMs = 10000;

    const aiPromise = generateWorkoutPlan({
      goal,
      availableDays,
      injuries,
      equipment,
      preferredSplit,
      experienceLevel,
    });

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error("AI workout plan generation timeout.")),
        aiTimeoutMs,
      ),
    );

    const { success, planText, error } = await Promise.race([
      aiPromise,
      timeoutPromise,
    ]);

    if (!success || !planText) {
      throw new Error(error || "AI failed to return a workout plan.");
    }

    const structuredPlan = parseAIWorkoutPlan(planText);

    const docRef = await addDoc(collection(db, "userPlans"), {
      userId,
      plan: structuredPlan,
      goal,
      availableDays,
      injuries,
      equipment,
      preferredSplit,
      experienceLevel,
      type: "AI",
      createdAt: new Date(),
    });

    return {
      success: true,
      planId: docRef.id,
      workoutPlan: structuredPlan,
    };
  } catch (err) {
    return {
      success: false,
      error: err.message || "Unknown error generating workout.",
    };
  }
};

export default generateWorkout;
