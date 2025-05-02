import {
  getMarketplacePlans,
  uploadPlan,
  getPlanById,
  updatePlan,
  deletePlan,
  purchasePlan,
} from '../api/marketplaceApi';

/**
 * Fetch all available marketplace plans.
 * @param {string} filter - Optional filter (e.g., "Strength", "Fat Loss")
 */
export const fetchMarketplacePlans = async (filter = '') => {
  return await getMarketplacePlans(filter);
};

/**
 * Upload a new plan to the marketplace.
 * @param {Object} planData
 */
export const uploadNewPlan = async (planData) => {
  return await uploadPlan(planData);
};

/**
 * Get detailed info about a specific plan.
 * @param {string} planId
 */
export const fetchPlanDetails = async (planId) => {
  return await getPlanById(planId);
};

/**
 * Update a marketplace plan.
 * @param {string} planId
 * @param {Object} updates
 */
export const updateExistingPlan = async (planId, updates) => {
  return await updatePlan(planId, updates);
};

/**
 * Delete a plan from the marketplace.
 * @param {string} planId
 */
export const deleteMarketplacePlan = async (planId) => {
  return await deletePlan(planId);
};

/**
 * Start purchase flow for a plan.
 * @param {Object} options - Must include { planId, buyerId, creatorStripeAccountId, priceInCents }
 */
export const initiatePlanPurchase = async (options) => {
  return await purchasePlan(options);
};
