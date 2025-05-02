// src/api/mealApi.js

import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL + '/meals';
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 500;

/**
 * Safely retrieves auth token from AsyncStorage
 */
const getAuthToken = async () => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    return token || '';
  } catch (err) {
    console.error('Error retrieving auth token:', err);
    return '';
  }
};

/**
 * Helper: Retry fetch requests with fallback logic
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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
 * Generates a custom AI meal plan based on preferences
 * @param {Object} preferences - goal, calories, macros, dietaryPrefs, mealsPerDay
 * @returns {Promise<Object>} - { success, mealPlan }
 */
export const generateMealPlan = async (preferences) => {
  try {
    const token = await getAuthToken();
    return await fetchWithRetry(`${BASE_URL}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(preferences),
    });
  } catch (err) {
    console.error('Error generating meal plan:', err);
    return { success: false, error: err.message };
  }
};

/**
 * Retrieves saved meal plans for a user
 * @param {string} userId
 * @returns {Promise<Object>} - { success, meals }
 */
export const getSavedMeals = async (userId) => {
  try {
    const token = await getAuthToken();
    const res = await fetchWithRetry(`${BASE_URL}/${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return { success: true, meals: res.meals || res };
  } catch (err) {
    console.error('Error fetching saved meals:', err);
    return { success: false, error: err.message };
  }
};

/**
 * Saves a meal plan for a user
 * @param {string} userId
 * @param {Object} mealData - goal, calories, macros, preferences, meals
 * @returns {Promise<Object>} - { success, mealPlanId }
 */
export const saveMealPlan = async (userId, mealData) => {
  try {
    const token = await getAuthToken();
    return await fetchWithRetry(`${BASE_URL}/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ userId, ...mealData }),
    });
  } catch (err) {
    console.error('Error saving meal plan:', err);
    return { success: false, error: err.message };
  }
};
