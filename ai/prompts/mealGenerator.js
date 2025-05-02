import { sendPrompt, cleanAIOutput } from '../../backend/utils/aiUtils.js';

/**
 * Generates a structured meal plan using AI prompt.
 *
 * @param {Object} input
 * @param {string} input.goal - e.g. 'Fat Loss'
 * @param {number} input.calories - e.g. 2200
 * @param {number} input.protein - in grams
 * @param {number} input.carbs - in grams
 * @param {number} input.fat - in grams
 * @param {string} input.dietaryPrefs - e.g. 'No dairy, gluten-free'
 * @param {number} input.mealsPerDay - default 4
 * @returns {Object} planText or error
 */
export const generateMealPlan = async ({
  goal,
  calories,
  protein,
  carbs,
  fat,
  dietaryPrefs,
  mealsPerDay = 4,
}) => {
  if (
    typeof goal !== 'string' ||
    typeof calories !== 'number' ||
    typeof protein !== 'number' ||
    typeof carbs !== 'number' ||
    typeof fat !== 'number' ||
    typeof mealsPerDay !== 'number' ||
    (dietaryPrefs && typeof dietaryPrefs !== 'string') ||
    !goal.trim() ||
    calories <= 0 ||
    protein <= 0 ||
    carbs <= 0 ||
    fat <= 0 ||
    mealsPerDay < 1
  ) {
    return {
      success: false,
      error: {
        message: 'Invalid input. Please check all fields for correct types and values.',
        code: 'INVALID_INPUT',
      },
    };
  }

  const prompt = `
You are a certified performance nutritionist creating a structured, goal-based meal plan.

=== USER CONTEXT ===
- Goal: ${goal}
- Calories: ${calories} kcal
- Macros: ${protein}g protein / ${carbs}g carbs / ${fat}g fat
- Dietary Restrictions: ${dietaryPrefs || 'None'}
- Meals Per Day: ${mealsPerDay}

=== OBJECTIVE ===
Create exactly ${mealsPerDay} clean, accessible meals.

=== FORMAT ===
Meal [X]: [Meal Name]  
- Ingredients: [List of common items]  
- Macros: [Calories] kcal | [Protein]g protein | [Carbs]g carbs | [Fat]g fat

Distribute calories/macros evenly across all meals.

=== DISCLAIMER ===
This plan is AI-generated and not a substitute for medical advice. Always consult a licensed nutritionist for personal guidance.

Begin:
`;

  const { success, result, error } = await sendPrompt(prompt);

  if (!success) {
    return {
      success: false,
      error: {
        message: 'Failed to generate meal plan.',
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
