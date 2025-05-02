import { sendPrompt, cleanAIOutput } from '../../backend/utils/aiUtils.js';

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
  if (
    !goal || typeof goal !== 'string' ||
    !availableDays || typeof availableDays !== 'number' ||
    !preferredSplit || typeof preferredSplit !== 'string' ||
    !experienceLevel || typeof experienceLevel !== 'string'
  ) {
    return {
      success: false,
      error: {
        message: 'Invalid input. Required fields: goal, availableDays, preferredSplit, experienceLevel.',
        code: 'INVALID_INPUT',
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
- Injuries: ${injuries || 'None'}
- Equipment: ${equipment || 'Standard gym machines & free weights'}

=== INSTRUCTIONS ===
- Provide a detailed 1-week workout plan
- Each day (Day 1 to Day ${availableDays}) includes:
  • Day Label (e.g., Push, Pull, Full Body)
  • 3–5 Exercises
  • Sets x Reps format
- Use safe variations if injuries are listed
- Include supersets or finishers when appropriate
- Do not include warmups, cooldowns, or general advice
- No explanations — just return the plan in pure format

=== OUTPUT FORMAT ===
Day 1 - Push  
- Barbell Bench Press: 4x8  
- Dumbbell Shoulder Press: 3x10  
- Cable Triceps Pushdown: 3x12

...

=== DISCLAIMER ===
This plan is AI-generated for educational use. It does not replace guidance from certified professionals. Consult a trainer or physician before starting any workout program.

Begin:
`;

  const { success, result, error } = await sendPrompt(prompt);

  if (!success) {
    return {
      success: false,
      error: {
        message: 'Workout plan generation failed.',
        details: error,
        code: 'PROMPT_FAILURE',
      },
    };
  }

  return {
    success: true,
    planText: cleanAIOutput(result),
  };
};
