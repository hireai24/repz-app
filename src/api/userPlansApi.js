import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;
const USER_PLANS_URL = `${BASE_URL}/api/save-plan`;
const XP_TRACK_URL = `${BASE_URL}/api/xp`;

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 500;

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

const getAuthToken = async () => {
  try {
    const token = await AsyncStorage.getItem("authToken");
    return token || "";
  } catch {
    return "";
  }
};

const fetchWithRetry = async (url, options = {}, retries = MAX_RETRIES) => {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, options);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${res.status}`);
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
 * Get all saved plans for a user
 */
export const getUserPlans = async (userId) => {
  const token = await getAuthToken();
  return fetchWithRetry(`${USER_PLANS_URL}/${userId}`, {
    headers: { Authorization: `Bearer ${token}` },
  }).catch((err) => ({ success: false, error: err.message }));
};

/**
 * Save a new user plan
 */
export const saveUserPlan = async (planData) => {
  const token = await getAuthToken();
  return fetchWithRetry(`${USER_PLANS_URL}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(planData),
  }).catch((err) => ({ success: false, error: err.message }));
};

/**
 * Track XP events (workout, battle, etc.)
 */
export const trackXP = async (xpPayload) => {
  const token = await getAuthToken();
  return fetchWithRetry(`${XP_TRACK_URL}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(xpPayload),
  }).catch((err) => ({ success: false, error: err.message }));
};
