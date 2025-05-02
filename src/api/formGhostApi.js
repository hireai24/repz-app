const BASE_URL = process.env.FORMGHOST_API_URL;

const RETRY_LIMIT = 3;
const RETRY_DELAY_MS = 1000;  // Increase delay to avoid hitting API rate limits

/**
 * Sleep helper for retry delays
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Wraps a function with retry logic
 */
const withRetries = async (fn, maxRetries = RETRY_LIMIT) => {
  let attempt = 0;
  while (attempt <= maxRetries) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === maxRetries) {
        console.error(`🔥 Max retries reached: ${err.message}`);
        throw err; // Throws if all retries fail
      }
      console.warn(`⚠️ Retry #${attempt + 1} failed: ${err.message}`);
      await sleep(RETRY_DELAY_MS);  // Sleep before retrying
      attempt++;
    }
  }
};

/**
 * Uploads a user's set video for form analysis by AI.
 * @param {string} userId
 * @param {string} fileUri - Local URI of video
 * @param {string} [exerciseName] - Optional: used for labeling
 * @returns {Promise<Object>} - { success, videoId, feedback?, error? }
 */
export const uploadFormVideo = async (userId, fileUri, exerciseName = '') => {
  return await withRetries(async () => {
    const formData = new FormData();
    formData.append('video', {
      uri: fileUri,
      name: 'form-video.mp4',
      type: 'video/mp4',
    });
    formData.append('userId', userId);
    formData.append('exerciseName', exerciseName);

    const res = await fetch(`${BASE_URL}/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Upload failed: ${errText}`);
    }

    const data = await res.json();
    console.log('✅ Form video uploaded successfully:', data);
    return { success: true, ...data };
  }).catch((err) => {
    console.error('🔥 FormGhost video upload error:', err);
    return { success: false, error: err.message || 'Upload failed.' };
  });
};

/**
 * Fetches AI-generated feedback for a submitted form video.
 * @param {string} videoId
 * @returns {Promise<Object>} - { success, feedback?, error? }
 */
export const getFormFeedback = async (videoId) => {
  return await withRetries(async () => {
    const res = await fetch(`${BASE_URL}/feedback/${videoId}`);

    if (!res.ok) {
      throw new Error(`Failed to fetch form feedback: ${res.status}`);
    }

    const data = await res.json();
    console.log('✅ Form feedback received successfully:', data);
    return { success: true, ...data };
  }).catch((err) => {
    console.error('🔥 FormGhost feedback fetch error:', err);
    return { success: false, error: err.message || 'Fetch failed.' };
  });
};
