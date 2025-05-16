import { collection, addDoc } from "firebase/firestore";

import { db } from "../firebase/init.js";
import { generateMealPlan as generateMealPlanAI } from "../../ai/prompts/mealGenerator.js";

const generateMealPlan = async (
  userId,
  { goal, calories, macros, preferences = {}, mealsPerDay = 4 },
) => {
  if (
    !userId ||
    typeof userId !== "string" ||
    !goal ||
    typeof goal !== "string" ||
    !calories ||
    typeof calories !== "number" ||
    !macros ||
    typeof macros !== "object" ||
    !macros.protein ||
    typeof macros.protein !== "number" ||
    !macros.carbs ||
    typeof macros.carbs !== "number" ||
    !macros.fat ||
    typeof macros.fat !== "number" ||
    typeof mealsPerDay !== "number"
  ) {
    return {
      success: false,
      error:
        "Missing or invalid inputs. Ensure userId, goal, calories, macros, and mealsPerDay are valid.",
    };
  }

  try {
    const { protein, carbs, fat } = macros;

    const aiTimeoutMs = 10000; // 10 second timeout for AI fallback safety

    const aiPromise = generateMealPlanAI({
      goal,
      calories,
      protein,
      carbs,
      fat,
      dietaryPrefs: preferences,
      mealsPerDay,
    });

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error("AI meal plan generation timeout.")),
        aiTimeoutMs,
      ),
    );

    const { success, planText, error } = await Promise.race([
      aiPromise,
      timeoutPromise,
    ]);

    if (!success || !planText) {
      throw new Error(error || "AI prompt returned no result.");
    }

    const docRef = await addDoc(collection(db, "mealPlans"), {
      userId,
      goal,
      calories,
      macros,
      preferences,
      plan: planText,
      createdAt: new Date(),
    });

    return {
      success: true,
      mealPlanId: docRef.id,
      mealPlan: planText,
    };
  } catch (error) {
    console.error("🔥 Error generating meal plan:", error);
    return {
      success: false,
      error: error.message || "Unknown error generating meal plan.",
    };
  }
};

export default generateMealPlan;
