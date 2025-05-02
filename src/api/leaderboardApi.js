import AsyncStorage from '@react-native-async-storage/async-storage';

// TODO: Replace with environment variable later
const BASE_URL = 'https://your-backend-url.com/api/leaderboard';
const MAX_RETRIES = 2;

/**
 * Get auth token from storage or context.
 */
const getAuthToken = async () => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    return token || '';
  } catch (err) {
    console.error('🔥 Error retrieving auth token:', err);
    return '';
  }
};

/**
 * Helper to retry fetch requests with fallback.
 */
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
        console.error(`🔥 Request failed after ${attempt + 1} attempts:`, err.message);
        return { success: false, error: err.message || 'Request failed.' };
      }
      await new Promise((resolve) => setTimeout(resolve, 500)); // Optional: short delay between retries
    }
  }
};

/**
 * Submit a new lift entry with video proof for leaderboard.
 * @param {string} userId
 * @param {string} liftType
 * @param {number} weight
 * @param {string} videoUri
 * @returns {Promise<Object>} - { success, entryId }
 */
export const submitLift = async (userId, liftType, weight, videoUri) => {
  try {
    const token = await getAuthToken();

    const formData = new FormData();
    formData.append('video', {
      uri: videoUri,
      name: `${liftType}-proof.mp4`,
      type: 'video/mp4',
    });
    formData.append('userId', userId);
    formData.append('liftType', liftType);
    formData.append('weight', weight);

    return await fetchWithRetry(`${BASE_URL}/submit`, {
      method: 'POST',
      body: formData,
      headers: {
        Authorization: `Bearer ${token}`,
        // ⚠️ Do NOT manually set 'Content-Type' with FormData!
      },
    });
  } catch (err) {
    console.error('🔥 Error submitting lift:', err.message);
    return { success: false, error: err.message || 'Submission failed.' };
  }
};

/**
 * Get top leaderboard entries for a lift type, filtered by location scope.
 * @param {string} liftType - e.g. "Squat", "Bench"
 * @param {string} locationFilter - 'global' | 'gym' | 'local'
 * @returns {Promise<Object>} - { success, results }
 */
export const getLeaderboard = async (liftType, locationFilter = 'global') => {
  try {
    const token = await getAuthToken();

    return await fetchWithRetry(`${BASE_URL}/${liftType}?scope=${locationFilter}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  } catch (err) {
    console.error('🔥 Error fetching leaderboard:', err.message);
    return { success: false, error: err.message || 'Leaderboard fetch failed.' };
  }
};

/**
 * Get the current user's rank for a lift type.
 * @param {string} userId
 * @param {string} liftType
 * @returns {Promise<Object>} - { success, rank, userId }
 */
export const getUserRank = async (userId, liftType) => {
  try {
    const token = await getAuthToken();

    return await fetchWithRetry(`${BASE_URL}/rank?userId=${userId}&liftType=${liftType}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  } catch (err) {
    console.error('🔥 Error fetching user rank:', err.message);
    return { success: false, error: err.message || 'Rank fetch failed.' };
  }
};
