// src/api/workoutApi.js

import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL; // Use base URL
const WORKOUT_API_URL = `${BASE_URL}/api/workout`; // Specific API URL for workouts
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
 * Get user's workout logs
 * @param {string} userId
 */
export const getWorkouts = async (userId) => {
  const token = await getAuthToken();
  return await fetchWithRetry(`${WORKOUT_API_URL}/${userId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

/**
 * Save a workout log
 * @param {string} userId
 * @param {object} workoutData
 */
export const saveWorkout = async (userId, workoutData) => {
  const token = await getAuthToken();
  return await fetchWithRetry(`${WORKOUT_API_URL}/save`, {
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
 * Fetch all AI-generated workout plans (if used for a marketplace)
 * NOTE: This endpoint might be different from the AI generation one.
 * Your current PlanBuilderScreen uses `/api/workout/generate`.
 */
export const getWorkoutPlans = async () => {
  const token = await getAuthToken();
  // This endpoint might be for pre-defined plans, not AI generation requests.
  // Verify what backend route this maps to if it's still needed.
  return await fetchWithRetry(`${WORKOUT_API_URL}/plans`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

/**
 * Generate a personalized workout plan via backend AI service.
 * @param {object} payload - { userId, fitnessGoal, equipment, injuries, availableDays, preferredSplit, experienceLevel }
 */
export const generateWorkoutPlan = async (payload) => { // NEW: Exported function for AI generation
  const token = await getAuthToken();
  return await fetchWithRetry(`${WORKOUT_API_URL}/generate`, { // Targets POST /api/workout/generate
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
};