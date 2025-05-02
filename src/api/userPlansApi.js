// src/api/userPlansApi.js

import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;
const USER_PLANS_URL = `${BASE_URL}/user-plans`;
const SAVE_PLAN_URL = `${BASE_URL}/user-plans/save`;

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 500;

/**
 * Get auth token safely
 */
const getAuthToken = async () => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    return token || '';
  } catch (err) {
    console.error('Token retrieval error:', err);
    return '';
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
      console.error(`Fetch attempt ${attempt + 1} failed:`, err.message);
      if (attempt === retries) {
        return { success: false, error: err.message };
      }
      await sleep(RETRY_DELAY_MS);
    }
  }
};

/**
 * Fetch all plans the user owns
 */
export const getUserPlans = async (userId) => {
  try {
    const token = await getAuthToken();
    return await fetchWithRetry(`${USER_PLANS_URL}/${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  } catch (err) {
    console.error('Error fetching user plans:', err);
    return { success: false, error: err.message };
  }
};

/**
 * Save a new user plan (AI-generated or uploaded)
 */
export const saveUserPlan = async (planData) => {
  try {
    const token = await getAuthToken();
    return await fetchWithRetry(SAVE_PLAN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(planData),
    });
  } catch (err) {
    console.error('Error saving user plan:', err);
    return { success: false, error: err.message };
  }
};
