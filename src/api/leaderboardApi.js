// src/api/leaderboardApi.js

import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL + "/api/leaderboard";
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

const fetchWithRetry = async (url, options = {}, retries = MAX_RETRIES) => {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, options);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error: ${res.status}`);
      }
      return await res.json();
    } catch (err) {
      if (attempt === retries) {
        return { success: false, error: err?.message || "Request failed." };
      }
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    }
  }
};

/**
 * Submit a new lift entry for the leaderboard.
 * @param {object} payload - { userId, exercise, weight, reps, gym, location, videoUrl, tier }
 */
export const submitLift = async (payload) => {
  try {
    const token = await getAuthToken();

    if (
      !payload.userId ||
      !payload.exercise ||
      typeof payload.weight !== "number"
    ) {
      return {
        success: false,
        error: "Missing required submission fields (userId, exercise, weight).",
      };
    }

    return await fetchWithRetry(`${BASE_URL}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    return { success: false, error: err?.message || "Submission failed." };
  }
};

/**
 * Get top leaderboard entries for a category and location, including user's rank.
 * @param {string} category - e.g., "Bench", "XP"
 * @param {string} filter - e.g., "Your Gym", "Global"
 * @param {string} [gymId] - Optional gym ID if filter is "Your Gym"
 */
export const getTopLifts = async (category, filter, gymId = null) => {
  try {
    const token = await getAuthToken();

    let locationScope = "global";
    let queryParams = `category=${encodeURIComponent(category)}`;

    if (filter === "Your Gym") {
      locationScope = "gym";
      if (gymId) {
        queryParams += `&location=${encodeURIComponent(locationScope)}&gymId=${encodeURIComponent(gymId)}`;
      } else {
        queryParams += `&location=${encodeURIComponent(locationScope)}`;
      }
    } else {
      locationScope = "global";
      queryParams += `&location=${encodeURIComponent(locationScope)}`;
    }

    return await fetchWithRetry(`${BASE_URL}?${queryParams}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  } catch (err) {
    return {
      success: false,
      error: err?.message || "Leaderboard fetch failed.",
    };
  }
};
