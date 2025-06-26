// src/api/mealApi.js

import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;
const MEAL_API_URL = `${BASE_URL}/api/meal`;

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 500;

const getAuthToken = async () => {
  try {
    const token = await AsyncStorage.getItem("authToken");
    return token || "";
  } catch (err) {
    return "";
  }
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const fetchWithRetry = async (url, options = {}, retries = MAX_RETRIES) => {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, options);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const errorMessage =
          errorData.error || `HTTP ${res.status} - ${res.statusText}`;
        throw new Error(errorMessage);
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

export const generateMealPlan = async (payload) => {
  const token = await getAuthToken();

  return await fetchWithRetry(`${MEAL_API_URL}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
};

export const getSavedMeals = async (userId) => {
  const token = await getAuthToken();
  const res = await fetchWithRetry(
    `${BASE_URL}/api/user-meals/saved/${userId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  return { success: res.success, plans: res.plans || [] };
};

export const saveMealPlan = async (userId, mealData) => {
  const token = await getAuthToken();
  return await fetchWithRetry(`${BASE_URL}/api/user-meals/save`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ userId, ...mealData }),
  });
};
