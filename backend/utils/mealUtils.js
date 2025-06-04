// backend/utils/mealUtils.js (Definitive location for buildMealPrompt)

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
export const buildMealPrompt = ({
  goal,
  calories,
  protein,
  carbs,
  fat,
  dietaryPrefs = "None",
  mealsPerDay = 4,
}) => {
  return `
You are a certified performance nutritionist designing a personalized meal plan tailored to the user's goals and macros.
Your output MUST be a JSON array. Each element in the array represents a meal.
Each meal object must have the following properties:
- "name": String (Creative Meal Name)
- "description": String (Bullet list of real-world ingredients for the meal)
- "calories": Number (Calories for this meal)
- "macros": Object with properties:
    - "protein": Number (Grams of protein for this meal)
    - "carbs": Number (Grams of carbs for this meal)
    - "fats": Number (Grams of fat for this meal)

The entire output should be a valid JSON array, without any additional text or formatting outside the JSON.

=== USER PROFILE ===
• Goal: ${goal}
• Daily Calories: ${calories} kcal
• Macros: ${protein}g Protein / ${carbs}g Carbs / ${fat}g Fat
• Dietary Preferences: ${dietaryPrefs}
• Meals Per Day: ${mealsPerDay}

=== TASK ===
Design ${mealsPerDay} clean, practical, and satisfying meals that:
- Use familiar, whole-food ingredients
- Split calories and macros as evenly as possible per meal
- Adhere to dietary restrictions/preferences
- Include a clear, enticing meal name

=== STYLE GUIDE ===
- Friendly and motivating tone (avoid clinical or robotic phrasing in the names and descriptions)
- Avoid repetition or generic meals
- No brand names, just real ingredients
- Easy to follow for a regular gym-goer or athlete

=== DISCLAIMER ===
This AI-generated meal plan is for informational purposes only and not a substitute for advice from a licensed nutrition professional.

Example of expected JSON output structure (ensure only the JSON is returned):
[
  {
    "name": "Morning Power Oatmeal",
    "description": "- 1/2 cup rolled oats\n- 1 scoop vanilla protein powder\n- 1/4 cup berries\n- 1 tbsp almond butter",
    "calories": 400,
    "macros": {
      "protein": 30,
      "carbs": 45,
      "fats": 12
    }
  },
  {
    "name": "Grilled Chicken Salad",
    "description": "- 6oz grilled chicken breast\n- 2 cups mixed greens\n- 1/2 avocado\n- 1 tbsp olive oil vinaigrette",
    "calories": 450,
    "macros": {
      "protein": 45,
      "carbs": 10,
      "fats": 25
    }
  }
]
`;
};