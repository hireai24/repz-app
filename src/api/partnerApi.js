// src/api/partnerApi.js

import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;
const PARTNER_URL = `${BASE_URL}/api/partner`;

const getAuthToken = async () => {
  const token = await AsyncStorage.getItem("authToken");
  return token || "";
};

export const getPartnerSlots = async (gymId) => {
  try {
    const token = await getAuthToken();
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
    return { success: false, error: err.message };
  }
};

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
    return { success: false, error: err.message };
  }
};

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
    return { success: false, error: err.message };
  }
};

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
    return { success: false, error: err.message };
  }
};
