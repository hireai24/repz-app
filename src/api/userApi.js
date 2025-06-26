// src/api/userApi.js

import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 500;

/**
 * Get auth token safely from storage
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
 * Retry fetch helper
 */
const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

const fetchWithRetry = async (url, options = {}, retries = MAX_RETRIES) => {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, options);
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || `HTTP ${res.status}`);
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
 * Fetch current user profile (via /users/me)
 */
export const getMyProfile = async () => {
  const token = await getAuthToken();
  return await fetchWithRetry(`${BASE_URL}/users/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

/**
 * Fetch user profile by ID (for admin or fallback)
 */
export const getUserProfile = async (userId, overrideToken = null) => {
  const token = overrideToken || (await getAuthToken());

  console.log("userId ", userId, token);
  return await fetchWithRetry(`${BASE_URL}/users/${userId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

/**
 * Update user profile
 */
export const updateUserProfile = async (userId, updates) => {
  const token = await getAuthToken();
  return await fetchWithRetry(`${BASE_URL}/users/update/${userId}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(updates),
  });
};

/**
 * Delete user account
 */
export const deleteUserAccount = async (userId) => {
  const token = await getAuthToken();
  return await fetchWithRetry(`${BASE_URL}/users/delete/${userId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
};

/**
 * Send password reset email
 */
export const sendPasswordReset = async (email) => {
  return await fetchWithRetry(`${BASE_URL}/users/password-reset`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
};

/**
 * Request Stripe onboarding link
 */
export const getStripeOnboardingLink = async (userId) => {
  const token = await getAuthToken();
  const { url } = await fetchWithRetry(
    `${BASE_URL}/users/stripe-onboard/${userId}`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    },
  );

  return { success: true, url };
};

/**
 * Check user subscription entitlements
 */
export const getUserEntitlement = async (userId) => {
  const token = await getAuthToken();
  return await fetchWithRetry(`${BASE_URL}/users/entitlements/${userId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

/**
 * Utility: Determine user tier based on entitlement flags
 */
export const determineUserTier = async (userId) => {
  const { success, access } = await getUserEntitlement(userId);
  if (!success) return "Free";

  if (access?.elite) return "Elite";
  if (access?.pro) return "Pro";
  return "Free";
};
