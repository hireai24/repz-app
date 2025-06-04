// src/api/mealApi.js

import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL; // Base URL from env
const MEAL_API_URL = `${BASE_URL}/api/meal`; // Specific API URL for meal plans

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 500;

/**
 * Safely retrieves auth token from AsyncStorage
 */
const getAuthToken = async () => {
  try {
    const token = await AsyncStorage.getItem("authToken");
    return token || "";
  } catch (err) {
    console.error("Failed to get auth token from storage:", err);
    return "";
  }
};

/**
 * Helper: Retry fetch requests with fallback logic
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const fetchWithRetry = async (url, options = {}, retries = MAX_RETRIES) => {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, options);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({})); // Try to parse JSON error, fallback to empty object
        const errorMessage = errorData.error || `HTTP ${res.status} - ${res.statusText}`;
        throw new Error(errorMessage);
      }
      return await res.json();
    } catch (err) {
      if (attempt === retries) {
        console.error(`fetchWithRetry failed after ${retries + 1} attempts for URL: ${url}`, err);
        return { success: false, error: err.message };
      }
      await sleep(RETRY_DELAY_MS);
    }
  }
};

/**
 * Generates a meal plan via the backend AI service.
 * This is the primary function used by MealPlannerScreen.
 * @param {object} payload - { userId, goal, dietaryPreferences, dailyCalories, protein, carbs, fat, mealsPerDay }
 * @returns {Promise<object>} - { success, plan, error }
 */
export const generateMealPlan = async (payload) => { // REMOVED authUser as it's not needed in payload
  const token = await getAuthToken();

  return await fetchWithRetry(`${MEAL_API_URL}`, { // Targets POST /api/meal
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    // Removed userTier from payload as it's redundant (backend gets it from req.user)
    body: JSON.stringify(payload),
  });
};

/**
 * Retrieves saved meal plans for a user
 * Note: Your backend needs routes for this. Added placeholder route.
 * @param {string} userId
 * @returns {Promise<Object>} - { success, plans }
 */
export const getSavedMeals = async (userId) => {
  const token = await getAuthToken();
  // Placeholder URL. You'll need a backend route like /api/user-meals/saved/:userId
  // Assuming the `mealController.js` logic for `getUserMealPlans` will be exposed.
  const res = await fetchWithRetry(`${BASE_URL}/api/user-meals/saved/${userId}`, { // UPDATED URL
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return { success: res.success, plans: res.plans || [] }; // Return plans array if successful
};

/**
 * Saves a meal plan for a user
 * Note: Your backend needs routes for this. Added placeholder route.
 * @param {string} userId
 * @param {Object} mealData - goal, calories, macros, preferences, meals
 * @returns {Promise<Object>} - { success, mealPlanId }
 */
export const saveMealPlan = async (userId, mealData) => {
  const token = await getAuthToken();
  // Placeholder URL. You'll need a backend route like /api/user-meals/save
  // Assuming the `mealController.js` logic for `saveMealPlan` will be exposed.
  return await fetchWithRetry(`${BASE_URL}/api/user-meals/save`, { // UPDATED URL
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ userId, ...mealData }),
  });
};