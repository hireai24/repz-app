import { collection, addDoc } from "firebase/firestore";
import { format } from "date-fns";

import { db } from "../firebase/init";

/**
 * Converts a single workout log into a formatted object for smart plan usage.
 * Used for plan history, AI feedback, and workout summaries.
 */
const formatWorkoutToPlan = (log) => {
  if (!log || !Array.isArray(log.exercises)) return null;

  const formatted = {
    day: format(new Date(log.date), "yyyy-MM-dd"),
    totalExercises: log.exercises.length,
    totalVolume: log.exercises.reduce((sum, ex) => {
      const weight = typeof ex.weight === "number" ? ex.weight : 0;
      const sets = typeof ex.sets === "number" ? ex.sets : 0;
      const reps = typeof ex.reps === "number" ? ex.reps : 0;
      return sum + sets * reps * weight;
    }, 0),
    exercises: log.exercises.map((ex) => ({
      name: ex.name || "Unknown",
      sets: typeof ex.sets === "number" ? ex.sets : 0,
      reps: typeof ex.reps === "number" ? ex.reps : 0,
      weight: typeof ex.weight === "number" ? `${ex.weight} kg` : "Bodyweight",
      notes: ex.notes || "",
    })),
    challengeEntry: !!log.challengeId,
  };

  return formatted;
};

/**
 * Takes multiple logs and compiles them into a weekly plan array.
 * For use in visual summaries, AI analysis, and review.
 */
const compileWeeklyPlan = (logs = []) => {
  return logs.map(formatWorkoutToPlan).filter(Boolean);
};

/**
 * Save a plan to Firestore under userPlans (used for both AI and purchased plans)
 * @param {Object} plan - { userId, name, type, exercises[], createdAt, source }
 * @returns {Promise<string>} - planId
 */
const saveUserPlanToFirestore = async (plan) => {
  if (
    !plan.userId ||
    typeof plan.userId !== "string" ||
    !Array.isArray(plan.exercises)
  ) {
    throw new Error(
      "Missing or invalid plan: userId and exercises are required.",
    );
  }

  const validExercises = plan.exercises.filter((ex) => {
    return (
      typeof ex.name === "string" &&
      typeof ex.sets === "number" &&
      typeof ex.reps === "number"
    );
  });

  const docRef = await addDoc(collection(db, "userPlans"), {
    userId: plan.userId,
    name: plan.name || "Untitled Plan",
    type: plan.type || "Workout",
    source: plan.source || "Manual", // AI | Upload | Purchase | Manual
    exercises: validExercises,
    createdAt: plan.createdAt
      ? new Date(plan.createdAt).toISOString()
      : new Date().toISOString(),
  });

  return docRef.id;
};

export { formatWorkoutToPlan, compileWeeklyPlan, saveUserPlanToFirestore };
