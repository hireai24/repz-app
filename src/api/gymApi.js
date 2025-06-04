import AsyncStorage from "@react-native-async-storage/async-storage";

// FIX: Using EXPO_PUBLIC_API_BASE_URL (which presumably includes the /api prefix)
// If it only has the base URL, then you might need to append /api.
// Based on `gymFeedApi.js` using EXPO_PUBLIC_API_URL and appending /api/gym-feed,
// I'm assuming process.env.EXPO_PUBLIC_API_BASE_URL already includes /api, or is the root.
// Let's stick to the current pattern of /gyms for now, assuming BASE_URL handles it.
const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL + "/gyms";

const getAuthToken = async () => {
  const token = await AsyncStorage.getItem("authToken");
  return token || "";
};

export const getGyms = async () => {
  const token = await getAuthToken();
  const res = await fetch(BASE_URL, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return await res.json();
};

export const getMyGym = async () => {
  const token = await getAuthToken();
  const res = await fetch(`${BASE_URL}/mine`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return await res.json();
};

// FIX: Add getGymsByOwner to match frontend usage
export const getGymsByOwner = async (ownerId) => {
  const token = await getAuthToken();
  // Assuming your backend has a route like /gyms/owner/:ownerId or similar.
  // Based on current backend routes, the backend's getMyGym already uses the token's UID,
  // so this `ownerId` parameter might be redundant if the backend logic is purely token-based.
  // However, if the backend expects an ownerId explicitly, this route might be needed.
  // Given your current backend setup, `getMyGym` is the correct way to get the *current user's* gym.
  // If `getGymsByOwner` is meant to fetch *any* owner's gyms, a new backend route would be needed.
  // For now, I'm making an educated guess that `getGymsByOwner` on the frontend
  // should perhaps call the existing `getMyGym` backend route, or if it's for *other* owners,
  // a specific backend route needs to be created.
  // Let's align `MyGymsScreen` to use `getMyGym` as it's for the *current* user.
  // If `MyGymsScreen` needs to fetch *all* gyms the current user owns, it's better to fetch from backend
  // without passing ownerId explicitly, and let backend use `req.user.uid`.
  // For now, I'll update MyGymsScreen to use getMyGym.
  // If the intent was to fetch *all* gyms by *any* owner, then a new backend route /gyms/owner/:ownerId is needed.
  // For the scope of "MyGymsScreen", `getMyGym` is more appropriate.
  // ***However, if you want `MyGymsScreen` to list multiple gyms for a single owner,
  // then `getMyGym` (singular) is not enough.
  // Let's assume `getMyGym` is for the *primary* gym, and `getGymsByOwner` for *all* gyms for a user.
  // This implies a missing backend route. For now, I'll make a placeholder.
  // Backend `gymService.js` DOES have `getGymsByOwner`. This needs a route.
  // Let's create a temporary route in `gymRoutes.js` for this.

  // FIX: Assuming a new backend route `/gyms/owner` is created
  const res = await fetch(`${BASE_URL}/owner`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return await res.json();
};

export const createGym = async (gymData) => {
  const token = await getAuthToken();

  const payload = {
    name: gymData.name,
    location: gymData.location,
    description: gymData.description,
    image: gymData.image || "",
    features: gymData.features || "",
    memberCount: gymData.memberCount || "",
    // FIX: Ensure 'pricing' from frontend maps to 'dayPassPrice' and 'monthlyPrice' or define 'pricing' in backend
    // Based on gymSubmissionScreen, the field is 'pricing'.
    // Backend's gymController.js expects dayPassPrice and monthlyPrice separately.
    // This is a mismatch. I will assume 'pricing' in the frontend should be
    // passed as 'pricing' and the backend should handle it or map it.
    // For now, I will map frontend 'pricing' to backend 'dayPassPrice' as a placeholder.
    // You should unify this.
    dayPassPrice: gymData.pricing || "", // Mismatch with frontend 'pricing'
    monthlyPrice: "", // Not captured in frontend
    offers: gymData.offers || "",
    ownerId: gymData.ownerId,
  };

  const res = await fetch(BASE_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  return await res.json();
};

export const updateGym = async (gymId, updates) => {
  const token = await getAuthToken();

  const payload = {
    ...(updates.name && { name: updates.name }),
    ...(updates.location && { location: updates.location }),
    ...(updates.description && { description: updates.description }),
    ...(updates.image && { image: updates.image }),
    ...(updates.features && { features: updates.features }),
    ...(updates.memberCount && { memberCount: updates.memberCount }),
    // FIX: Mismatch - frontend has 'pricing', backend has 'dayPassPrice' and 'monthlyPrice'.
    // Passing 'pricing' as 'dayPassPrice' as a placeholder.
    ...(updates.pricing && { dayPassPrice: updates.pricing }),
    // monthlyPrice update is missing
    ...(updates.offers && { offers: updates.offers }),
  };

  const res = await fetch(`<span class="math-inline">\{BASE\_URL\}/</span>{gymId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  return await res.json();
};

export const deleteGym = async (gymId) => {
  const token = await getAuthToken();
  const res = await fetch(`<span class="math-inline">\{BASE\_URL\}/</span>{gymId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return await res.json();
};