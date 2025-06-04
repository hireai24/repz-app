// src/api/partnerApi.js

import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;
const PARTNER_URL = `${BASE_URL}/api/partner`; // Adjusted to match server.js mounting point

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
    // Assuming gymId is sent as a query parameter for GET /api/partner/
    const res = await fetch(`${PARTNER_URL}?gymId=${gymId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(errorText || "Failed to fetch partner slots.");
    }
    const data = await res.json();
    return { success: true, data };
  } catch (err) {
    console.error("Error fetching partner slots:", err.message);
    return { success: false, error: err.message };
  }
};

/**
 * Create a new partner slot (session post).
 * @param {Object} slotData - { timeSlot, gymId, maxSpots, userId, username, gymName, note, avatar, tier }
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

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(errorText || "Failed to create partner slot.");
    }
    const data = await res.json();
    return { success: true, data };
  } catch (err) {
    console.error("Error creating partner slot:", err.message);
    return { success: false, error: err.message };
  }
};

/**
 * Accept/join a training slot.
 * @param {string} slotId
 * @param {string} userId - New parameter for the user accepting the invite
 */
export const acceptPartnerInvite = async (slotId, userId) => {
  try {
    const token = await getAuthToken();
    const res = await fetch(`${PARTNER_URL}/join/${slotId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ userId }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(errorText || "Failed to join partner slot.");
    }
    return { success: true };
  } catch (err) {
    console.error("Error accepting partner invite:", err.message);
    return { success: false, error: err.message };
  }
};

/**
 * Leave a training slot.
 * @param {string} slotId
 * @param {string} userId - New parameter for the user leaving the slot
 */
export const leavePartnerSlot = async (slotId, userId) => {
  try {
    const token = await getAuthToken();
    const res = await fetch(`${PARTNER_URL}/leave/${slotId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ userId }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(errorText || "Failed to leave partner slot.");
    }
    return { success: true };
  } catch (err) {
    console.error("Error leaving partner slot:", err.message);
    return { success: false, error: err.message };
  }
};