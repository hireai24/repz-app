import { getOpenAIResponse } from "../utils/openaiHelper.js";
import { buildMealPrompt } from "../utils/mealUtils.js";

/**
 * Generates a structured AI-powered meal plan based on user goals and macros.
 */
export const generateMealPlan = async ({
  user,
  userId,
  goal,
  calories,
  protein,
  carbs,
  fat,
  dietaryPreferences = "",
  mealsPerDay = 4,
}) => {
  if (!user?.tier || !["Pro", "Elite"].includes(user.tier)) {
    return {
      success: false,
      error: {
        code: "TIER_RESTRICTED",
        message: "Upgrade required to access meal planner.",
      },
    };
  }

  const isValid =
    typeof userId === "string" &&
    typeof goal === "string" &&
    typeof calories === "number" &&
    typeof protein === "number" &&
    typeof carbs === "number" &&
    typeof fat === "number" &&
    typeof mealsPerDay === "number" &&
    (!dietaryPreferences || typeof dietaryPreferences === "string") &&
    userId.trim() &&
    goal.trim() &&
    calories > 0 &&
    protein > 0 &&
    carbs > 0 &&
    fat > 0 &&
    mealsPerDay >= 1;

  if (!isValid) {
    // eslint-disable-next-line no-console
    console.warn("Invalid input for meal plan generation:", {
      userId,
      goal,
      calories,
      protein,
      carbs,
      fat,
      dietaryPreferences,
      mealsPerDay,
    });
    return {
      success: false,
      error: {
        code: "INVALID_INPUT",
        message:
          "Invalid input. Ensure all required fields (goal, calories, protein, carbs, fat, userId) are correctly filled.",
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
    const messages = [{ role: "user", content: prompt }];
    const rawPlanText = await getOpenAIResponse(messages);

    let parsedPlan;
    try {
      parsedPlan = JSON.parse(rawPlanText);
      if (
        !Array.isArray(parsedPlan) ||
        parsedPlan.some((meal) => !meal.name || !meal.macros)
      ) {
        throw new Error(
          "AI response was not a valid structured meal plan array.",
        );
      }
    } catch (parseError) {
      // eslint-disable-next-line no-console
      console.error(
        "Failed to parse OpenAI meal plan response as JSON, attempting fallback regex parsing:",
        parseError,
      );
      parsedPlan = parseMealPlanTextToObjects(rawPlanText);
      if (!parsedPlan || parsedPlan.length === 0) {
        throw new Error("Could not parse meal plan from AI response.");
      }
    }

    return {
      success: true,
      plan: parsedPlan,
    };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error generating meal plan from OpenAI:", error);
    return {
      success: false,
      error: {
        code: "PROMPT_FAILURE",
        message:
          error.message ||
          "Failed to generate meal plan due to an AI processing error.",
        details: error.message,
      },
    };
  }
};

function parseMealPlanTextToObjects(planText) {
  const meals = [];
  const mealBlocks = planText
    .split(/Meal \d+:/)
    .filter((block) => block.trim() !== "");

  mealBlocks.forEach((block) => {
    const lines = block
      .trim()
      .split("\n")
      .filter((line) => line.trim() !== "");
    if (lines.length === 0) return;

    let name = lines[0].trim();
    if (name.startsWith("Meal ")) {
      name = name.split(": ")[1] || name;
    }

    let description = [];
    let calories = 0;
    let protein = 0;
    let carbs = 0;
    let fat = 0;

    lines.slice(1).forEach((line) => {
      if (line.includes("Ingredients:")) {
        description.push(line.replace("• Ingredients:", "Ingredients:").trim());
      } else if (line.includes("Macros:")) {
        const macroMatch = line.match(
          /(\d+)kcal \| (\d+)g Protein \| (\d+)g Carbs \| (\d+)g Fat/,
        );
        if (macroMatch) {
          calories = parseInt(macroMatch[1], 10);
          protein = parseInt(macroMatch[2], 10);
          carbs = parseInt(macroMatch[3], 10);
          fat = parseInt(macroMatch[4], 10);
        }
      } else if (line.startsWith("•")) {
        description.push(line.trim());
      }
    });

    meals.push({
      name: name,
      description: description.join("\n"),
      calories: calories,
      macros: {
        protein: protein,
        carbs: carbs,
        fats: fat,
      },
    });
  });

  return meals;
}
