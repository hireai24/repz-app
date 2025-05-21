// src/api/partnerApi.js

import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;
const PARTNER_URL = `${BASE_URL}/partner-slots`;

/**
 * Get auth token for secure requests.
 */
const getAuthToken = async () => {
  const token = await AsyncStorage.getItem("authToken");
  return token || "";
};

/**
 * Fetch open partner slots for current gym.
 * @param {string} gymId
 * @returns {Object} { success, data, error }
 */
export const getPartnerSlots = async (gymId) => {
  try {
    const token = await getAuthToken();
    const res = await fetch(`${PARTNER_URL}?gymId=${gymId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

/**
 * Create a new partner slot (session post).
 * @param {Object} slotData - { timeSlot, gymId, maxSpots }
 */
export const createPartnerSlot = async (slotData) => {
  try {
    const token = await getAuthToken();
    const res = await fetch(`${PARTNER_URL}/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(slotData),
    });

    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

/**
 * Accept/join a training slot.
 * @param {string} slotId
 */
export const acceptPartnerInvite = async (slotId) => {
  try {
    const token = await getAuthToken();
    const res = await fetch(`${PARTNER_URL}/join/${slotId}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) throw new Error(await res.text());
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

/**
 * Leave a training slot.
 * @param {string} slotId
 */
export const leavePartnerSlot = async (slotId) => {
  try {
    const token = await getAuthToken();
    const res = await fetch(`${PARTNER_URL}/leave/${slotId}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) throw new Error(await res.text());
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
};
