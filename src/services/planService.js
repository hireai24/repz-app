import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  getMarketplacePlans,
  uploadPlan,
  getPlanById,
  updatePlan,
  deletePlan,
  purchasePlan,
} from "../api/marketplaceApi";

const CACHE_KEY = "repz_marketplace_plans";
const MAX_RETRIES = 3;
const RETRY_DELAY = 500;

/**
 * Retry a promise-returning function with exponential backoff.
 * @param {Function} fn - Function that returns a promise
 * @param {number} retries
 * @param {number} delay
 */
const retryWithBackoff = async (
  fn,
  retries = MAX_RETRIES,
  delay = RETRY_DELAY,
) => {
  try {
    return await fn();
  } catch (err) {
    if (retries === 0) {
      // For production, avoid exposing full error details if sensitive
      const errorMessage = process.env.NODE_ENV === "production"
        ? "Network error, please try again."
        : err.message;
      throw new Error(errorMessage);
    }
    await new Promise((res) => setTimeout(res, delay));
    return retryWithBackoff(fn, retries - 1, delay * 2);
  }
};

/**
 * Fetch all available marketplace plans with optional filter and caching.
 * @param {string} filter - Optional filter (e.g., "Strength", "Fat Loss")
 * @returns {Promise<{success: boolean, plans?: Array, cached?: boolean, error?: string}>}
 */
export const fetchMarketplacePlans = async (filter = "") => {
  try {
    const response = await retryWithBackoff(() => getMarketplacePlans(filter));
    if (response.success && Array.isArray(response.plans)) {
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(response.plans));
    }
    // Return the full response from the API, including potential error message
    return response;
  } catch (error) {
    // Only log warnings/errors to console in development
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.warn("⚠️ Failed to fetch marketplace plans. Attempting to load cached version...", error);
    }

    try {
      const cached = await AsyncStorage.getItem(CACHE_KEY);
      if (cached) {
        return {
          success: true,
          cached: true,
          plans: JSON.parse(cached),
          error: "Could not fetch latest plans, showing cached data." // Informative message
        };
      }
    } catch (cacheErr) {
      if (process.env.NODE_ENV !== "production") {
        // eslint-disable-next-line no-console
        console.error("❌ Failed to load cached plans:", cacheErr);
      }
    }
    // Provide a more generic error message for the user in production
    const errorMessage = process.env.NODE_ENV === "production"
      ? "Unable to fetch plans. Please check your internet connection."
      : error.message || "Failed to fetch plans and no cached data available.";

    return {
      success: false,
      error: errorMessage,
    };
  }
};

/**
 * Upload a new plan to the marketplace.
 * @param {Object} planData
 * @returns {Promise}
 */
export const uploadNewPlan = async (planData) => {
  return retryWithBackoff(() => uploadPlan(planData));
};

/**
 * Get detailed info about a specific plan.
 * @param {string} planId
 * @returns {Promise}
 */
export const fetchPlanDetails = async (planId) => {
  return retryWithBackoff(() => getPlanById(planId));
};

/**
 * Update a marketplace plan.
 * @param {string} planId
 * @param {Object} updates
 * @returns {Promise}
 */
export const updateExistingPlan = async (planId, updates) => {
  return retryWithBackoff(() => updatePlan(planId, updates));
};

/**
 * Delete a plan from the marketplace.
 * @param {string} planId
 * @returns {Promise}
 */
export const deleteMarketplacePlan = async (planId) => {
  return retryWithBackoff(() => deletePlan(planId));
};

/**
 * Start purchase flow for a plan.
 * @param {Object} options - { planId }
 * @returns {Promise<{success: boolean, sessionId?: string, url?: string, error?: string}>}
 */
export const initiatePlanPurchase = async (options) => {
  // `options` should now only contain `planId` as other details like buyerId, buyerEmail
  // are derived from authentication context on the backend, and creator/plan details from Firestore.
  return retryWithBackoff(() => purchasePlan(options));
};