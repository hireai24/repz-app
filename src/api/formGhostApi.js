// src/api/formGhostApi.js

import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/$/, "") + "/form";
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 500;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getAuthToken = async () => {
  try {
    const token = await AsyncStorage.getItem("authToken");
    return token || "";
  } catch {
    return "";
  }
};

/**
 * Upload form video and trigger form analysis via internal backend
 * @param {string} userId
 * @param {string} fileUri
 * @param {string} exerciseName
 * @returns {Promise<Object>}
 */
export const uploadFormVideo = async (userId, fileUri, exerciseName = "") => {
  const token = await getAuthToken();
  const formData = new FormData();

  formData.append("video", {
    uri: fileUri,
    name: "form-video.mp4",
    type: "video/mp4",
  });

  formData.append("userId", userId);
  formData.append("exerciseType", exerciseName);

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(`${BASE_URL}/analyze`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || `HTTP ${res.status}`);
      }

      const data = await res.json();
      return { success: true, ...data };
    } catch (err) {
      if (attempt === MAX_RETRIES) {
        return { success: false, error: err.message };
      }
      await sleep(RETRY_DELAY_MS);
    }
  }
};
