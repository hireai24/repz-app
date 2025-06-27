// src/api/partnerApi.js

import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;
const PARTNER_URL = `${BASE_URL}/api/partner`;

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 500;

/**
 * Get auth token safely
 */
const getAuthToken = async () => {
  try {
    const token = await AsyncStorage.getItem("authToken");
    return token || "";
  } catch {
    return "";
  }
};

/**
 * Sleep helper for retries
 */
const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

/**
 * Standard fetch with retries and fallback
 */
const fetchWithRetry = async (url, options = {}, retries = MAX_RETRIES) => {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, options);
      if (!res.ok) {
        const errorText = await res.text().catch(() => "");
        throw new Error(errorText || `HTTP ${res.status}`);
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

/**
 * Get partner slots for a gym
 * @param {string} gymId
 */
export const getPartnerSlots = async (gymId) => {
  const token = await getAuthToken();
  return await fetchWithRetry(`${PARTNER_URL}?gymId=${gymId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

/**
 * Create a new partner slot
 * @param {object} slotData
 */
export const createPartnerSlot = async (slotData) => {
  const token = await getAuthToken();
  return await fetchWithRetry(`${PARTNER_URL}/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(slotData),
  });
};

/**
 * Accept a partner slot invitation
 * @param {string} slotId
 * @param {string} userId
 */
export const acceptPartnerInvite = async (slotId, userId) => {
  const token = await getAuthToken();
  return await fetchWithRetry(`${PARTNER_URL}/join/${slotId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ userId }),
  });
};

/**
 * Leave a partner slot
 * @param {string} slotId
 * @param {string} userId
 */
export const leavePartnerSlot = async (slotId, userId) => {
  const token = await getAuthToken();
  return await fetchWithRetry(`${PARTNER_URL}/leave/${slotId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ userId }),
  });
};
