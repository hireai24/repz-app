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
  authUser,
) => {
  if (!authUser?.tier || !["Pro", "Elite"].includes(authUser.tier)) {
    return {
      success: false,
      error: "Upgrade required to access this feature (Plan Builder).",
      status: 403,
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
      status: 400,
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

    const aiResponse = await Promise.race([aiPromise, timeoutPromise]);

    if (!aiResponse || !aiResponse.success || !aiResponse.planText) {
      throw new Error(
        aiResponse?.error?.message || "AI failed to return a workout plan.",
      );
    }

    const structuredPlan = parseAIWorkoutPlan(aiResponse.planText);

    const docRef = await addDoc(collection(db, "userPlans"), {
      userId,
      name: `AI Plan - ${goal}`,
      type: "AI Workout",
      exercises: structuredPlan,
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
    // eslint-disable-next-line no-console
    console.error("Error in generateWorkout function:", err);
    return {
      success: false,
      error: err.message || "Unknown error generating workout plan.",
      status: 500,
    };
  }
};

export default generateWorkout;
