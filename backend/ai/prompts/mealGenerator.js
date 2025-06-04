import dotenv from "dotenv";
dotenv.config();

// REMOVED: import fetch from "node-fetch"; // No longer makes API calls directly

/**
 * Builds a structured, high-conversion meal plan prompt for AI generation.
 *
 * @param {Object} input
 * @param {string} input.goal - User’s goal (e.g., "Fat Loss", "Muscle Gain")
 * @param {number} input.calories - Total daily calories
 * @param {number} input.protein - Grams of protein
 * @param {number} input.carbs - Grams of carbs
 * @param {number} input.fat - Grams of fat
 * @param {string} [input.dietaryPrefs] - e.g. "Vegan, No Gluten"
 * @param {number} [input.mealsPerDay=4] - Meals per day (default = 4)
 * @returns {string} AI prompt to send to OpenAI
 */
export const buildMealPrompt = ({ // Exported as named export
  goal,
  calories,
  protein,
  carbs,
  fat,
  dietaryPrefs = "None",
  mealsPerDay = 4,
}) => {
  // Removed validation here, as it's handled upstream in generateMealPlanLogic.js
  return `
You are a certified performance nutritionist designing a personalized meal plan tailored to the user's goals and macros.

=== USER PROFILE ===
• Goal: ${goal}
• Daily Calories: ${calories} kcal
• Macros: ${protein}g Protein / ${carbs}g Carbs / ${fat}g Fat
• Dietary Preferences: ${dietaryPrefs}
• Meals Per Day: ${mealsPerDay}

=== TASK ===
Design ${mealsPerDay} clean, practical, and satisfying meals that:
- Use familiar, whole-food ingredients
- Split calories and macros evenly per meal
- Adhere to dietary restrictions/preferences
- Include a clear, enticing meal name

=== OUTPUT FORMAT ===
Meal X: [Creative Meal Name]
• Ingredients: [Bullet list of real-world ingredients]
• Macros: [Calories] kcal | [Protein]g Protein | [Carbs]g Carbs | [Fat]g Fat

=== STYLE GUIDE ===
- Friendly and motivating tone (avoid clinical or robotic phrasing)
- Avoid repetition or generic meals
- No brand names, just real ingredients
- Easy to follow for a regular gym-goer or athlete

=== DISCLAIMER ===
This plan is AI-generated and not a substitute for medical advice. Always consult a licensed nutritionist for personal guidance.

Begin:
`;
};