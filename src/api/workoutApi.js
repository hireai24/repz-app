// src/api/workoutApi.js

const BASE_URL = 'https://your-backend-url.com/api/workouts';
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 500;

/**
 * Sleep helper for retries
 */
const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

/**
 * Unified fetch with retry support
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
      console.error(`Fetch attempt ${attempt + 1} failed:`, err.message);
      if (attempt === retries) {
        return { success: false, error: err.message };
      }
      await sleep(RETRY_DELAY_MS);
    }
  }
};

/**
 * Fetches all workouts for a given user
 */
export const getWorkouts = async (userId) => {
  try {
    return await fetchWithRetry(`${BASE_URL}/${userId}`);
  } catch (err) {
    console.error('Error fetching workouts:', err);
    return { success: false, error: err.message };
  }
};

/**
 * Saves a workout log for a user
 */
export const saveWorkout = async (userId, workoutData) => {
  try {
    return await fetchWithRetry(`${BASE_URL}/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        ...workoutData,
      }),
    });
  } catch (err) {
    console.error('Error saving workout:', err);
    return { success: false, error: err.message };
  }
};

/**
 * Fetches all available AI-generated workout plans
 */
export const getWorkoutPlans = async () => {
  try {
    return await fetchWithRetry(`${BASE_URL}/plans`);
  } catch (err) {
    console.error('Error fetching workout plans:', err);
    return { success: false, error: err.message };
  }
};
