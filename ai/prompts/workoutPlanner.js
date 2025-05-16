import { sendPrompt, cleanAIOutput } from "../../backend/utils/aiUtils.js";

/**
 * Generates a 1-week gym workout plan using AI prompt.
 *
 * @param {Object} input
 * @param {string} input.goal - e.g. 'Fat Loss', 'Strength'
 * @param {number} input.availableDays - e.g. 4
 * @param {string} input.preferredSplit - e.g. 'Push/Pull/Legs'
 * @param {string} input.injuries - e.g. 'Knee pain' or empty string
 * @param {string} input.equipment - e.g. 'Barbell, Dumbbells'
 * @param {string} input.experienceLevel - e.g. 'Intermediate'
 * @returns {Object} planText or error
 */
export const generateWorkoutPlan = async ({
  goal,
  availableDays,
  preferredSplit,
  injuries,
  equipment,
  experienceLevel,
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

  const prompt = `
You are an elite personal trainer AI building a safe, effective, and motivating 1-week gym workout plan.

=== USER PROFILE ===
- Goal: ${goal}
- Experience: ${experienceLevel}
- Available Days: ${availableDays}
- Preferred Split: ${preferredSplit}
- Injuries: ${injuries || "None"}
- Equipment: ${equipment || "Standard gym machines & free weights"}

=== INSTRUCTIONS ===
Provide a structured 1-week plan:
• Label each day (e.g., Push, Pull, Full Body)
• Include 3–5 exercises per day in Sets x Reps format
• Use injury-safe variations if applicable
• Include supersets or finishers where fitting
• Do not add warmups, cooldowns, tips, or explanations

=== OUTPUT FORMAT ===
Day 1 - Push  
- Barbell Bench Press: 4x8  
- Dumbbell Shoulder Press: 3x10  
- Cable Triceps Pushdown: 3x12

...

=== DISCLAIMER ===
This plan is AI-generated for educational use. Always consult a certified trainer or physician before starting any new program.

Begin:
`;

  try {
    const { success, result, error } = await sendPrompt(prompt);

    if (!success) {
      return {
        success: false,
        error: {
          message: "Workout plan generation failed.",
          details: error,
          code: "PROMPT_FAILURE",
        },
      };
    }

    return {
      success: true,
      planText: cleanAIOutput(result),
    };
  } catch (err) {
    return {
      success: false,
      error: {
        message: "Unexpected error during workout generation.",
        details: err,
        code: "UNEXPECTED_ERROR",
      },
    };
  }
};
