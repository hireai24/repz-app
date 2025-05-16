import AsyncStorage from "@react-native-async-storage/async-storage";
import { getUserPlans, saveUserPlan } from "../api/userPlansApi";

const USER_PLANS_CACHE_KEY = (userId) => `repz_user_plans_${userId}`;
const MAX_RETRIES = 3;
const RETRY_DELAY = 400;

/**
 * Retry wrapper with exponential backoff
 */
const retryWithBackoff = async (fn, retries = MAX_RETRIES, delay = RETRY_DELAY) => {
  try {
    return await fn();
  } catch (err) {
    if (retries === 0) throw err;
    await new Promise((res) => setTimeout(res, delay));
    return retryWithBackoff(fn, retries - 1, delay * 2);
  }
};

/**
 * Get all plans owned by a specific user, with retry and local caching.
 * @param {string} userId
 */
export const fetchUserPlans = async (userId) => {
  const cacheKey = USER_PLANS_CACHE_KEY(userId);

  try {
    const response = await retryWithBackoff(() => getUserPlans(userId));

    if (response.success && Array.isArray(response.plans)) {
      await AsyncStorage.setItem(cacheKey, JSON.stringify(response.plans));
    }

    return response;
  } catch (err) {
    console.warn("⚠️ Failed to fetch user plans, falling back to cache.");

    try {
      const cached = await AsyncStorage.getItem(cacheKey);
      if (cached) {
        return {
          success: true,
          cached: true,
          plans: JSON.parse(cached),
        };
      }
    } catch (cacheErr) {
      console.error("❌ Failed to load cached user plans:", cacheErr);
    }

    return {
      success: false,
      error: "Failed to fetch user plans and no cached data available.",
    };
  }
};

/**
 * Save a user-created or AI-generated plan.
 * @param {Object} planData - Should include userId, name, exercises, type, etc.
 */
export const saveNewUserPlan = async (planData) => {
  return retryWithBackoff(() => saveUserPlan(planData));
};
