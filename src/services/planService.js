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
    if (retries === 0) throw err;
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
    return response;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn(
      "⚠️ Failed to fetch marketplace plans. Loading cached version...",
    );
    try {
      const cached = await AsyncStorage.getItem(CACHE_KEY);
      if (cached) {
        return {
          success: true,
          cached: true,
          plans: JSON.parse(cached),
        };
      }
    } catch (cacheErr) {
      // eslint-disable-next-line no-console
      console.error("❌ Failed to load cached plans:", cacheErr);
    }
    return {
      success: false,
      error: "Failed to fetch plans and no cached data available.",
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
 * @param {Object} options - { planId, buyerId, creatorStripeAccountId, priceInCents }
 * @returns {Promise}
 */
export const initiatePlanPurchase = async (options) => {
  return retryWithBackoff(() => purchasePlan(options));
};
