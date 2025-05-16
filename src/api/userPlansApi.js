// src/api/userPlansApi.js

import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;
const USER_PLANS_URL = `${BASE_URL}/save-plan`;
const XP_TRACK_URL = `${BASE_URL}/xp`; // Added for XP tracking if needed

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 500;

/**
 * Get auth token safely
 */
const getAuthToken = async () => {
  try {
    const token = await AsyncStorage.getItem("authToken");
    return token || "";
  } catch {
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
        const errText = await res.text();
        throw new Error(errText || `HTTP ${res.status}`);
      }
      return await res.json();
    } catch (err) {
      if (attempt === retries) {
        return { success: false, error: err.message };
      }
      await sleep(RETRY_DELAY_MS);
    }
  }
};

/**
 * Fetch all saved user plans
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
 * Optional: Track XP after saving
 */
export const trackXP = async (xpPayload) => {
  const token = await getAuthToken();
  return await fetchWithRetry(`${XP_TRACK_URL}/log`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(xpPayload),
  });
};
