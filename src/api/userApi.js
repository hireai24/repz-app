import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 500;

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

const getAuthToken = async () => {
  try {
    const token = await AsyncStorage.getItem("authToken");
    return token || "";
  } catch {
    return "";
  }
};

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

// ✅ /users/me
export const getMyProfile = async () => {
  const token = await getAuthToken();
  return fetchWithRetry(`${BASE_URL}/users/me`, {
    headers: { Authorization: `Bearer ${token}` },
  }).catch((err) => ({ success: false, error: err.message }));
};

// ✅ /users/:id
export const getUserProfile = async (userId, overrideToken = null) => {
  const token = overrideToken || (await getAuthToken());

  return fetchWithRetry(`${BASE_URL}/users/${userId}`, {
    headers: { Authorization: `Bearer ${token}` },
  }).catch((err) => ({ success: false, error: err.message }));
};

// ✅ PUT /users/update/:id
export const updateUserProfile = async (userId, updates) => {
  const token = await getAuthToken();
  return fetchWithRetry(`${BASE_URL}/users/update/${userId}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(updates),
  }).catch((err) => ({ success: false, error: err.message }));
};

// ✅ DELETE /users/delete/:id
export const deleteUserAccount = async (userId) => {
  const token = await getAuthToken();
  return fetchWithRetry(`${BASE_URL}/users/delete/${userId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  }).catch((err) => ({ success: false, error: err.message }));
};

// ✅ POST /users/password-reset
export const sendPasswordReset = async (email) => {
  return fetchWithRetry(`${BASE_URL}/users/password-reset`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  }).catch((err) => ({ success: false, error: err.message }));
};

// ✅ POST /users/stripe-onboard/:id
export const getStripeOnboardingLink = async (userId) => {
  const token = await getAuthToken();
  try {
    const { url } = await fetchWithRetry(
      `${BASE_URL}/users/stripe-onboard/${userId}`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return { success: true, url };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

// ✅ /users/entitlements/:id
export const getUserEntitlement = async (userId) => {
  const token = await getAuthToken();
  return fetchWithRetry(`${BASE_URL}/users/entitlements/${userId}`, {
    headers: { Authorization: `Bearer ${token}` },
  }).catch((err) => ({ success: false, error: err.message }));
};

// ✅ Derived: Free, Pro, Elite
export const determineUserTier = async (userId) => {
  const { success, access } = await getUserEntitlement(userId);
  if (!success) return "Free";

  if (access?.elite) return "Elite";
  if (access?.pro) return "Pro";
  return "Free";
};
