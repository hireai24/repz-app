// src/api/workoutApi.js

import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL + "/api/workout";
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
 * Sleep helper for retry delays
 */
const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

/**
 * Fetch wrapper with retries
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
        return { success: false, error: err.message };
      }
      await sleep(RETRY_DELAY_MS);
    }
  }
};

/**
 * Get user's workout logs
 */
export const getWorkouts = async (userId) => {
  const token = await getAuthToken();
  return await fetchWithRetry(`${BASE_URL}/${userId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

/**
 * Save a workout log
 */
export const saveWorkout = async (userId, workoutData) => {
  const token = await getAuthToken();
  return await fetchWithRetry(`${BASE_URL}/save`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      userId,
      ...workoutData,
    }),
  });
};

/**
 * Fetch all AI-generated workout plans
 */
export const getWorkoutPlans = async () => {
  const token = await getAuthToken();
  return await fetchWithRetry(`${BASE_URL}/plans`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};
