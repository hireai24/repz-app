import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL; // Use base URL
const PLANS_API_URL = `${BASE_URL}/api/plans`; // Corrected: Path in marketplace.routes.js is just "/" for root, so use "/api/plans"
const PURCHASE_URL = `${BASE_URL}/api/stripe/purchase-plan`; // Corrected: Full path including /api

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 500;

const getAuthToken = async () => {
  try {
    const token = await AsyncStorage.getItem("authToken");
    return token || "";
  } catch (err) {
    // console.error("Failed to get auth token:", err); // Keep commented for production
    return "";
  }
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const fetchWithRetry = async (url, options = {}, retries = MAX_RETRIES) => {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, options);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        // Provide more detailed error message from backend if available
        throw new Error(errorData.error || `HTTP error: ${res.status} for ${url}`);
      }
      return await res.json();
    } catch (err) {
      if (attempt === retries) {
        // console.error("fetchWithRetry failed after retries:", err); // Keep commented for production
        // Return a structured error for the service layer
        return { success: false, error: err.message };
      }
      await sleep(RETRY_DELAY_MS);
    }
  }
};

export const getMarketplacePlans = async (filter = "") => {
  const token = await getAuthToken();
  return await fetchWithRetry(
    `${PLANS_API_URL}?filter=${encodeURIComponent(filter)}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );
};

export const uploadPlan = async (planData) => {
  const token = await getAuthToken();
  return await fetchWithRetry(`${PLANS_API_URL}/upload`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(planData),
  });
};

export const getPlanById = async (planId) => {
  const token = await getAuthToken();
  return await fetchWithRetry(`${PLANS_API_URL}/${planId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const updatePlan = async (planId, updates) => {
  const token = await getAuthToken();
  return await fetchWithRetry(`${PLANS_API_URL}/update/${planId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(updates),
  });
};

export const deletePlan = async (planId) => {
  const token = await getAuthToken();
  return await fetchWithRetry(`${PLANS_API_URL}/delete/${planId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const purchasePlan = async (options) => {
  const token = await getAuthToken();
  return await fetchWithRetry(PURCHASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(options),
  });
};