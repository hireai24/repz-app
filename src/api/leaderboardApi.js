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
    // console.error("Failed to get auth token from storage:", err);
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
        // console.error("fetchWithRetry failed after retries:", err);
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

    if (!payload.userId || !payload.exercise || typeof payload.weight !== 'number') {
      return { success: false, error: "Missing required submission fields (userId, exercise, weight)." };
    }

    return await fetchWithRetry(`${BASE_URL}`, { // Targets POST /api/leaderboard
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    // console.error("submitLift API failed:", err);
    return { success: false, error: err?.message || "Submission failed." };
  }
};

/**
 * Get top leaderboard entries for a category and location, including user's rank.
 * Corresponds to backend's getTopLifts and getUserRank combined in one route.
 * @param {string} category - e.g., "Bench", "XP"
 * @param {string} filter - e.g., "Your Gym", "Global"
 * @param {string} [gymId] - Optional gym ID if filter is "Your Gym"
 */
export const getTopLifts = async (category, filter, gymId = null) => {
  try {
    const token = await getAuthToken();

    let locationScope = "global"; // Backend parameter
    let queryParams = `category=${encodeURIComponent(category)}`;

    if (filter === "Your Gym") {
      locationScope = "gym";
      if (gymId) {
        queryParams += `&location=<span class="math-inline">\{encodeURIComponent\(locationScope\)\}&gymId\=</span>{encodeURIComponent(gymId)}`;
      } else {
        queryParams += `&location=${encodeURIComponent(locationScope)}`;
      }
    } else {
      locationScope = "global";
      queryParams += `&location=${encodeURIComponent(locationScope)}`;
    }

    return await fetchWithRetry(
      `<span class="math-inline">\{BASE\_URL\}?</span>{queryParams}`, // Targets GET /api/leaderboard?category=...&location=...&gymId=...
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
  } catch (err) {
    // console.error("getTopLifts API failed:", err);
    return {
      success: false,
      error: err?.message || "Leaderboard fetch failed.",
    };
  }
};

// Note: Frontend's standalone getUserRank API call is removed here because
// the backend's main GET /api/leaderboard route now returns userRank within its response.
// If this function is used elsewhere (not the leaderboard screen), you may need to reconsider.