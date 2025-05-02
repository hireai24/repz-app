import AsyncStorage from '@react-native-async-storage/async-storage';
import { saveUserPlan } from './userPlansApi';

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL + '/plans';
const PURCHASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL + '/purchase';
const USER_PLANS_URL = process.env.EXPO_PUBLIC_API_BASE_URL + '/user-plans';

const MAX_RETRIES = 2;

/**
 * Get auth token safely.
 */
const getAuthToken = async () => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    return token || '';
  } catch (err) {
    console.error('🔥 Token retrieval error:', err.message);
    return '';
  }
};

/**
 * Fetch with retry logic.
 */
const fetchWithRetry = async (url, options = {}, retries = MAX_RETRIES) => {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, options);
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || `HTTP ${res.status}`);
      }
      return await res.json();
    } catch (err) {
      if (attempt === retries) {
        console.error(`🔥 Fetch failed after ${attempt + 1} attempts:`, err.message);
        return { success: false, error: err.message };
      }
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }
};

/**
 * Fetch all public marketplace plans filtered by type or tag.
 */
export const getMarketplacePlans = async (filter = '') => {
  const token = await getAuthToken();
  return await fetchWithRetry(`${BASE_URL}?filter=${encodeURIComponent(filter)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

/**
 * Upload a new workout or meal plan to the marketplace.
 */
export const uploadPlan = async (planData) => {
  const token = await getAuthToken();
  return await fetchWithRetry(`${BASE_URL}/upload`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(planData),
  });
};

/**
 * Get details of a specific plan by ID.
 */
export const getPlanById = async (planId) => {
  const token = await getAuthToken();
  return await fetchWithRetry(`${BASE_URL}/${planId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

/**
 * Update an existing plan.
 */
export const updatePlan = async (planId, updates) => {
  const token = await getAuthToken();
  return await fetchWithRetry(`${BASE_URL}/update/${planId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(updates),
  });
};

/**
 * Delete a plan from the marketplace.
 */
export const deletePlan = async (planId) => {
  const token = await getAuthToken();
  return await fetchWithRetry(`${BASE_URL}/delete/${planId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

/**
 * Initiate a purchase (90% to creator, 10% to platform).
 */
export const purchasePlan = async (options) => {
  const token = await getAuthToken();
  return await fetchWithRetry(PURCHASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(options),
  });
};

/**
 * Get plans the current user owns (created or purchased).
 */
export const getUserPlans = async (userId) => {
  const token = await getAuthToken();
  return await fetchWithRetry(`${USER_PLANS_URL}/${userId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

// Re-export saveUserPlan for marketplace use
export { saveUserPlan };
