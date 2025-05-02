import { getUserPlans, saveUserPlan } from '../api/userPlansApi';

/**
 * Get all plans owned by a specific user.
 * @param {string} userId
 */
export const fetchUserPlans = async (userId) => {
  return await getUserPlans(userId);
};

/**
 * Save a user-created or AI-generated plan.
 * @param {Object} planData - Should include userId, name, exercises, type, etc.
 */
export const saveNewUserPlan = async (planData) => {
  return await saveUserPlan(planData);
};
