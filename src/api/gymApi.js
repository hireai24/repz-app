// src/api/gymApi.js

import AsyncStorage from "@react-native-async-storage/async-storage";

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

export const getGymsByOwner = async () => {
  const token = await getAuthToken();
  // Assumes backend route is /gyms/owner and uses current token UID
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
    dayPassPrice: gymData.pricing || "",
    monthlyPrice: "",
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
    ...(updates.pricing && { dayPassPrice: updates.pricing }),
    ...(updates.offers && { offers: updates.offers }),
  };

  const res = await fetch(`${BASE_URL}/${gymId}`, {
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
  const res = await fetch(`${BASE_URL}/${gymId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return await res.json();
};
