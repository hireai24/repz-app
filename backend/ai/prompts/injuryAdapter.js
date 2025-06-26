import dotenv from "dotenv";
dotenv.config();

import fetch from "node-fetch";

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
  const fieldsValid = [
    exerciseName,
    muscleGroup,
    injuryType,
    equipmentAvailable,
  ].every((field) => typeof field === "string" && field.trim() !== "");

  if (!fieldsValid) {
    return {
      success: false,
      error: {
        message: "Invalid input. All fields must be non-empty strings.",
        code: "INVALID_INPUT",
      },
    };
  }

  const content = `
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

  try {
    const res = await fetch(
      `${process.env.EXPO_PUBLIC_API_BASE_URL}/api/openai`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [{ role: "user", content }],
        }),
      },
    );

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "AI call failed");

    return { success: true, alternative: data.result };
  } catch (err) {
    return {
      success: false,
      error: {
        message: "AI request failed.",
        details: err.message || err,
        code: "PROMPT_FAILURE",
      },
    };
  }
};
