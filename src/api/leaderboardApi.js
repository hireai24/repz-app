// src/api/leaderboardApi.js

import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL + "/api/leaderboard";
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 500;

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
        const errorText = await res.text();
        throw new Error(errorText || `HTTP error: ${res.status}`);
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
 * Submit a new lift entry with video proof for leaderboard.
 */
export const submitLift = async (userId, liftType, weight, videoUri) => {
  try {
    const token = await getAuthToken();

    const formData = new FormData();
    formData.append("video", {
      uri: videoUri,
      name: `${liftType}-proof.mp4`,
      type: "video/mp4",
    });
    formData.append("userId", userId);
    formData.append("liftType", liftType);
    formData.append("weight", weight);

    return await fetchWithRetry(`${BASE_URL}/submit`, {
      method: "POST",
      body: formData,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  } catch (err) {
    return { success: false, error: err?.message || "Submission failed." };
  }
};

/**
 * Get top leaderboard entries for a lift type.
 */
export const getLeaderboard = async (liftType, locationFilter = "global") => {
  try {
    const token = await getAuthToken();

    return await fetchWithRetry(
      `${BASE_URL}/${liftType}?scope=${locationFilter}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
  } catch (err) {
    return {
      success: false,
      error: err?.message || "Leaderboard fetch failed.",
    };
  }
};

/**
 * Get the current user's rank for a lift type.
 */
export const getUserRank = async (userId, liftType) => {
  try {
    const token = await getAuthToken();

    return await fetchWithRetry(
      `${BASE_URL}/rank?userId=${userId}&liftType=${liftType}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
  } catch (err) {
    return { success: false, error: err?.message || "Rank fetch failed." };
  }
};
