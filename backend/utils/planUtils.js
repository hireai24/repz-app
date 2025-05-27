import { collection, addDoc } from "firebase/firestore";
import { format } from "date-fns";
import { db } from "../firebase/init.js";

/**
 * Converts a single workout log into a formatted object for smart plan usage.
 * @param {Object} log - The workout log object.
 * @returns {Object|null}
 */
const formatWorkoutToPlan = (log) => {
  if (!log || !Array.isArray(log.exercises)) return null;

  return {
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
};

/**
 * Compiles multiple workout logs into a clean weekly array.
 * @param {Array} logs
 * @returns {Array}
 */
const compileWeeklyPlan = (logs = []) =>
  logs.map(formatWorkoutToPlan).filter(Boolean);

/**
 * Saves a user plan to Firestore.
 * @param {Object} plan
 * @returns {Promise<string>} - The new document ID.
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

  const validExercises = plan.exercises.filter(
    (ex) =>
      typeof ex.name === "string" &&
      typeof ex.sets === "number" &&
      typeof ex.reps === "number",
  );

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

/**
 * Parses AI-generated workout plans (GPT text) into structured format.
 * @param {string} text
 * @returns {Array}
 */
const parseAIWorkoutPlan = (text = "") => {
  const blocks = text
    .split(/\n(?=Day \d+)/)
    .map((block) => block.trim())
    .filter(Boolean);

  return blocks.map((block) => {
    const [header, ...lines] = block.split("\n");
    const exercises = lines
      .map((line) => {
        const [name, details] = line.split(":");
        if (!name || !details) return null;
        return {
          name: name.trim(),
          details: details.trim(), // e.g., "4x8"
        };
      })
      .filter(Boolean);

    return {
      day: header,
      exercises,
    };
  });
};

export {
  formatWorkoutToPlan,
  compileWeeklyPlan,
  saveUserPlanToFirestore,
  parseAIWorkoutPlan, // For use in AI-generated plans
};
