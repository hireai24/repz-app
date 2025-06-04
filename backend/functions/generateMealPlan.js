// backend/functions/generateMealPlan.js (Renamed for clarity and consistency)

import { getOpenAIResponse } from "../utils/openaiHelper.js";
import { buildMealPrompt } from "../utils/mealUtils.js"; // This will be the single source for buildMealPrompt

/**
 * Generates a structured AI-powered meal plan based on user goals and macros.
 * This function handles the AI call and tier enforcement.
 *
 * @param {Object} params
 * @param {Object} params.user - User object (must include `tier` from req.user)
 * @param {string} params.userId - User ID
 * @param {string} params.goal - User's primary fitness goal (e.g., "Fat Loss", "Muscle Gain")
 * @param {number} params.calories - Total daily calories
 * @param {number} params.protein - Grams of protein
 * @param {number} params.carbs - Grams of carbs
 * @param {number} params.fat - Grams of fat
 * @param {string} [params.dietaryPreferences=""] - e.g. "Vegan, No Gluten"
 * @param {number} [params.mealsPerDay=4]
 * @returns {Promise<Object>} - { success, plan, error }
 */
export const generateMealPlan = async ({
  user,
  userId,
  goal, // ADDED: Now explicitly receiving goal
  calories,
  protein,
  carbs,
  fat,
  dietaryPreferences = "",
  mealsPerDay = 4,
}) => {
  // 🔐 Tier enforcement
  if (!user?.tier || !["Pro", "Elite"].includes(user.tier)) {
    return {
      success: false,
      error: {
        code: "TIER_RESTRICTED",
        message: "Upgrade required to access meal planner.",
      },
    };
  }

  // Basic validation (already in place)
  const isValid =
    typeof userId === "string" &&
    typeof goal === "string" && // ADDED: Validate goal
    typeof calories === "number" &&
    typeof protein === "number" &&
    typeof carbs === "number" &&
    typeof fat === "number" &&
    typeof mealsPerDay === "number" &&
    (!dietaryPreferences || typeof dietaryPreferences === "string") &&
    userId.trim() &&
    goal.trim() && // ADDED: Validate goal
    calories > 0 &&
    protein > 0 &&
    carbs > 0 &&
    fat > 0 &&
    mealsPerDay >= 1;

  if (!isValid) {
    console.warn("Invalid input for meal plan generation:", { userId, goal, calories, protein, carbs, fat, dietaryPreferences, mealsPerDay });
    return {
      success: false,
      error: {
        code: "INVALID_INPUT",
        message: "Invalid input. Ensure all required fields (goal, calories, protein, carbs, fat, userId) are correctly filled.",
      },
    };
  }

  const prompt = buildMealPrompt({
    goal,
    calories,
    protein,
    carbs,
    fat,
    dietaryPrefs: dietaryPreferences,
    mealsPerDay,
  });

  try {
    // The prompt now explicitly asks for JSON, so we expect a parsable string.
    const messages = [{ role: "user", content: prompt }];
    const rawPlanText = await getOpenAIResponse(messages); // REMOVED: user.token as it's backend call

    // Attempt to parse the response into a structured JSON array
    let parsedPlan;
    try {
      // Expecting a JSON array of meal objects based on prompt
      parsedPlan = JSON.parse(rawPlanText);
      // Basic check if it's an array and contains meal-like objects
      if (!Array.isArray(parsedPlan) || parsedPlan.some(meal => !meal.name || !meal.macros)) {
        throw new Error("AI response was not a valid structured meal plan array.");
      }
    } catch (parseError) {
      console.error("Failed to parse OpenAI meal plan response as JSON, attempting fallback regex parsing:", parseError);
      // Fallback for less structured AI responses if JSON parsing fails
      parsedPlan = parseMealPlanTextToObjects(rawPlanText);
      if (!parsedPlan || parsedPlan.length === 0) {
        throw new Error("Could not parse meal plan from AI response.");
      }
    }

    return {
      success: true,
      plan: parsedPlan, // Return the parsed structured plan
    };
  } catch (error) {
    console.error("Error generating meal plan from OpenAI:", error);
    return {
      success: false,
      error: {
        code: "PROMPT_FAILURE",
        message: error.message || "Failed to generate meal plan due to an AI processing error.",
        details: error.message,
      },
    };
  }
};

/**
 * Helper function to parse a string meal plan into structured objects.
 * This is a fallback and assumes a consistent format based on the prompt.
 * Ideally, the AI should return valid JSON directly.
 * @param {string} planText - The raw string response from OpenAI
 * @returns {Array<Object>} - An array of structured meal objects
 */
function parseMealPlanTextToObjects(planText) {
  const meals = [];
  const mealBlocks = planText.split(/Meal \d+:/).filter(block => block.trim() !== '');

  mealBlocks.forEach(block => {
    const lines = block.trim().split('\n').filter(line => line.trim() !== '');
    if (lines.length === 0) return;

    let name = lines[0].trim();
    if (name.startsWith('Meal ')) { // Remove "Meal X:" if it's accidentally included in name
      name = name.split(': ')[1] || name;
    }

    let description = [];
    let calories = 0;
    let protein = 0;
    let carbs = 0;
    let fat = 0;

    lines.slice(1).forEach(line => {
      if (line.includes('Ingredients:')) {
        description.push(line.replace('• Ingredients:', 'Ingredients:').trim());
      } else if (line.includes('Macros:')) {
        const macroMatch = line.match(/(\d+)kcal \| (\d+)g Protein \| (\d+)g Carbs \| (\d+)g Fat/);
        if (macroMatch) {
          calories = parseInt(macroMatch[1], 10);
          protein = parseInt(macroMatch[2], 10);
          carbs = parseInt(macroMatch[3], 10);
          fat = parseInt(macroMatch[4], 10);
        }
      } else if (line.startsWith('•')) {
        description.push(line.trim());
      }
    });

    meals.push({
      name: name,
      description: description.join('\n'), // Combine ingredients into description
      calories: calories,
      macros: {
        protein: protein,
        carbs: carbs,
        fats: fat, // Use 'fats' for consistency with MealPlanCard
      },
    });
  });

  return meals;
}