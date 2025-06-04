// src/api/userPlansApi.js

import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;
const USER_PLANS_URL = `${BASE_URL}/api/save-plan`; // Corrected path (missing /api)
const XP_TRACK_URL = `${BASE_URL}/api/xp`; // CORRECTED: Path to match backend trackXP.routes.js

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 500;

/**
 * Get auth token safely
 */
const getAuthToken = async () => {
  try {
    const token = await AsyncStorage.getItem("authToken");
    return token || "";
  } catch (err) {
    // console.error("Failed to get auth token from storage:", err);
    return "";
  }
};

/**
 * Retry helper for fetch
 */
const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

const fetchWithRetry = async (url, options = {}, retries = MAX_RETRIES) => {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, options);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({})); // Try to parse JSON error, fallback to empty object
        throw new Error(errorData.error || `HTTP ${res.status}`);
      }
      return await res.json();
    } catch (err) {
      if (attempt === retries) {
        // console.error("fetchWithRetry failed after retries:", err);
        return { success: false, error: err.message };
      }
      await sleep(RETRY_DELAY_MS);
    }
  }
};

/**
 * Fetch all saved user plans
 * @param {string} userId
 */
export const getUserPlans = async (userId) => {
  const token = await getAuthToken();
  return await fetchWithRetry(`${USER_PLANS_URL}/${userId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

/**
 * Save a new plan
 * @param {object} planData - Should include userId, name, exercises, type, etc.
 */
export const saveUserPlan = async (planData) => {
  const token = await getAuthToken();
  return await fetchWithRetry(`${USER_PLANS_URL}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(planData),
  });
};

/**
 * Track XP after saving or other events.
 * Note: Your backend trackXP.routes.js is POST /api/xp.
 * @param {object} xpPayload - { userId, source, amount, data? (for workout/battle mode) }
 */
export const trackXP = async (xpPayload) => {
  const token = await getAuthToken();
  return await fetchWithRetry(`${XP_TRACK_URL}`, { // CORRECTED: Target /api/xp
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(xpPayload),
  });
};