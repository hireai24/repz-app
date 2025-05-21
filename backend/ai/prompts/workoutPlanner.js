import dotenv from "dotenv";
dotenv.config();

import fetch from "node-fetch";

/**
 * Generates a 1-week gym workout plan using AI prompt.
 *
 * @param {Object} input
 * @param {string} input.goal - e.g. 'Fat Loss', 'Strength'
 * @param {number} input.availableDays - e.g. 4
 * @param {string} input.preferredSplit - e.g. 'Push/Pull/Legs'
 * @param {string} input.injuries - e.g. 'Knee pain' or ''
 * @param {string} input.equipment - e.g. 'Barbell, Dumbbells'
 * @param {string} input.experienceLevel - e.g. 'Intermediate'
 * @param {string} [input.gymContext] - Optional gym profile name or environment info
 * @returns {Object} { success, planText } or { success: false, error }
 */
export const generateWorkoutPlan = async ({
  goal,
  availableDays,
  preferredSplit,
  injuries,
  equipment,
  experienceLevel,
  gymContext = "",
}) => {
  const isValid =
    typeof goal === "string" &&
    typeof preferredSplit === "string" &&
    typeof experienceLevel === "string" &&
    typeof availableDays === "number" &&
    goal.trim() &&
    preferredSplit.trim() &&
    experienceLevel.trim() &&
    availableDays > 0;

  if (!isValid) {
    return {
      success: false,
      error: {
        message: "Invalid input. Required: goal, availableDays, preferredSplit, experienceLevel.",
        code: "INVALID_INPUT",
      },
    };
  }

  const gymNote = gymContext?.trim()
    ? `\n\n=== GYM CONTEXT ===\nThis user trains at: ${gymContext}. Consider equipment availability and gym style.\n`
    : "";

  const content = `
You are an elite personal trainer AI creating a precise, safe, and goal-specific 1-week gym workout plan.

=== USER PROFILE ===
- Goal: ${goal}
- Experience: ${experienceLevel}
- Available Days: ${availableDays}
- Preferred Split: ${preferredSplit}
- Injuries: ${injuries || "None"}
- Equipment: ${equipment || "Standard gym machines & free weights"}${gymNote}

=== INSTRUCTIONS ===
Provide a 1-week plan using the format below:
• Label each day clearly (e.g., Push, Pull, Full Body)
• 3–5 exercises per day, with clear Sets x Reps
• Include supersets or finishers only when appropriate
• Avoid any warmups, cooldowns, or explanations

=== OUTPUT FORMAT ===
Day 1 - Push  
- Barbell Bench Press: 4x8  
- Dumbbell Shoulder Press: 3x10  
- Cable Triceps Pushdown: 3x12  
...

=== DISCLAIMER ===
This is an AI-generated program for guidance only. Always consult a certified trainer before starting a new routine.

Begin plan now:
`;

  try {
    const res = await fetch(`${process.env.EXPO_PUBLIC_API_BASE_URL}/api/openai`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [{ role: "user", content }],
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "AI call failed");

    return {
      success: true,
      planText: data.result,
    };
  } catch (err) {
    return {
      success: false,
      error: {
        message: "Workout plan generation failed.",
        details: err.message || err,
        code: "PROMPT_FAILURE",
      },
    };
  }
};
