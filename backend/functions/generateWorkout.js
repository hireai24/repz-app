// backend/functions/generateWorkout.js

import { collection, addDoc } from "firebase/firestore";

import { db } from "../firebase/init.js";
import { parseAIWorkoutPlan } from "../utils/planUtils.js";
import { generateWorkoutPlan } from "../ai/prompts/workoutPlanner.js"; // This calls /api/openai

/**
 * Generates and saves a structured workout plan tied to the user.
 * @param {string} userId - Firebase user ID
 * @param {Object} data - User input: goal, days, injuries, equipment, etc.
 * @param {Object} authUser - Authenticated user object from req.user with tier info
 * @returns {Object} - { success, planId, workoutPlan, error?, status? }
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
  authUser, // CHANGED: Now explicitly receiving authUser with tier info
) => {
  // ✅ Tier Restriction - now using authUser.tier
  if (!authUser?.tier || !["Pro", "Elite"].includes(authUser.tier)) {
    return {
      success: false,
      error: "Upgrade required to access this feature (Plan Builder).",
      status: 403, // Add status for route handler
    };
  }

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
        "Invalid input. Ensure userId, goal, availableDays, preferredSplit, and experienceLevel are valid.",
      status: 400, // Add status for route handler
    };
  }

  try {
    const aiTimeoutMs = 10000; // 10 seconds timeout for AI response

    const aiPromise = generateWorkoutPlan({ // This itself calls /api/openai
      goal,
      availableDays,
      injuries,
      equipment,
      preferredSplit,
      experienceLevel,
      // gymContext: authUser.gym || "" // If you want to pass user's gym to AI prompt
    });

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error("AI workout plan generation timeout.")),
        aiTimeoutMs,
      ),
    );

    // Use Promise.race to handle timeout
    const aiResponse = await Promise.race([
      aiPromise,
      timeoutPromise,
    ]);

    if (!aiResponse || !aiResponse.success || !aiResponse.planText) {
      throw new Error(aiResponse?.error?.message || "AI failed to return a workout plan.");
    }

    const structuredPlan = parseAIWorkoutPlan(aiResponse.planText);

    // Save the AI-generated plan to userPlans collection
    const docRef = await addDoc(collection(db, "userPlans"), {
      userId,
      name: `AI Plan - ${goal}`, // Default name
      type: "AI Workout", // Specific type
      exercises: structuredPlan, // Array of {day, exercises}
      goal,
      availableDays,
      injuries,
      equipment,
      preferredSplit,
      experienceLevel,
      source: "AI",
      createdAt: new Date(),
    });

    return {
      success: true,
      planId: docRef.id,
      workoutPlan: structuredPlan,
    };
  } catch (err) {
    console.error("Error in generateWorkout function:", err); // Server-side debugging
    return {
      success: false,
      error: err.message || "Unknown error generating workout plan.",
      status: 500,
    };
  }
};

export default generateWorkout;