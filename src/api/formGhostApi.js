// src/api/formGhostApi.js

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system"; // ADDED: Import FileSystem

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL; // Base URL
const FORM_API_URL = `${BASE_URL}/api/form`; // Corrected path
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 500;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getAuthToken = async () => {
  try {
    const token = await AsyncStorage.getItem("authToken");
    return token || "";
  } catch (err) {
    // console.error("Failed to get auth token:", err);
    return "";
  }
};

/**
 * Upload form video and trigger form analysis via internal backend
 * This function will now send the actual video file to the backend
 * @param {string} userId
 * @param {string} localVideoUri - The local URI of the video file
 * @param {string} exerciseName
 * @returns {Promise<Object>}
 */
export const uploadFormVideo = async (
  userId,
  localVideoUri,
  exerciseName = "",
) => {
  const token = await getAuthToken();

  // Create a Blob from the local video URI
  const tempPath = FileSystem.cacheDirectory + localVideoUri.split("/").pop();
  await FileSystem.copyAsync({ from: localVideoUri, to: tempPath });
  const blob = await fetch(tempPath).then((res) => res.blob()); // Get blob from local URI

  const formData = new FormData();
  formData.append("video", blob, "form-video.mp4"); // Append blob, specify filename
  formData.append("userId", userId);
  formData.append("exerciseType", exerciseName);

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(`${FORM_API_URL}/analyze`, {
        // Target POST /api/form/analyze
        method: "POST",
        headers: {
          // Do NOT set Content-Type for FormData, browser/fetch will set it correctly with boundary
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({})); // Try to parse JSON error
        throw new Error(errorData.error || `HTTP ${res.status}`);
      }

      const data = await res.json();
      return { success: true, ...data };
    } catch (err) {
      if (attempt === MAX_RETRIES) {
        // console.error("uploadFormVideo API failed after retries:", err);
        return { success: false, error: err.message };
      }
      await sleep(RETRY_DELAY_MS);
    } finally {
      // Clean up temporary file if created
      if (tempPath && FileSystem.existsSync(tempPath)) {
        await FileSystem.deleteAsync(tempPath);
      }
    }
  }
  return { success: false, error: "Upload failed after all retries." }; // Fallback return
};
