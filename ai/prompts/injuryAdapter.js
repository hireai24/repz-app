import { sendPrompt, cleanAIOutput } from '../../backend/utils/aiUtils.js';

/**
 * Recommends a safer alternative to an exercise based on injury type.
 *
 * @param {Object} input
 * @param {string} input.exerciseName - e.g. 'Barbell Back Squat'
 * @param {string} input.muscleGroup - e.g. 'Quads'
 * @param {string} input.injuryType - e.g. 'Lower back strain'
 * @param {string} input.equipmentAvailable - e.g. 'Dumbbells, leg press machine'
 * @returns {Object} Safe alternative recommendation
 */
export const getInjurySafeAlternative = async ({
  exerciseName,
  muscleGroup,
  injuryType,
  equipmentAvailable,
}) => {
  if (
    typeof exerciseName !== 'string' ||
    typeof muscleGroup !== 'string' ||
    typeof injuryType !== 'string' ||
    typeof equipmentAvailable !== 'string' ||
    !exerciseName.trim() ||
    !muscleGroup.trim() ||
    !injuryType.trim()
  ) {
    return {
      success: false,
      error: {
        message: 'Invalid input. All fields must be non-empty strings.',
        code: 'INVALID_INPUT',
      },
    };
  }

  const prompt = `
You are a certified rehab-oriented strength coach and injury prevention expert.

Scenario:
- Original Exercise: ${exerciseName}
- Target Muscle Group: ${muscleGroup}
- Injury: ${injuryType}
- Equipment Available: ${equipmentAvailable}

=== GOAL ===
Suggest ONE safe, effective ALTERNATIVE exercise that:
1. Still targets the same muscle group.
2. Avoids movements that could aggravate the specific injury.
3. Uses only the equipment the user has access to.

=== OUTPUT FORMAT ===
Safe Alternative:  
- Name: [Exercise Name]  
- Why it’s safer: [Brief medical-sound reasoning]  
- Equipment needed: [e.g. Dumbbells, Bench]

=== DISCLAIMER ===
This is not medical advice. Always consult a licensed healthcare provider or physiotherapist before starting a new exercise if you're recovering from injury.

Return ONLY the output above. No introductions, no extra commentary.
`;

  const { success, result, error } = await sendPrompt(prompt);

  if (!success) {
    return {
      success: false,
      error: {
        message: 'AI prompt failed',
        details: error,
        code: 'PROMPT_FAILURE',
      },
    };
  }

  return {
    success: true,
    alternative: cleanAIOutput(result),
  };
};
