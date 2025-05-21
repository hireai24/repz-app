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

export const createGym = async (gymData) => {
  const token = await getAuthToken();
  const res = await fetch(BASE_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(gymData),
  });
  return await res.json();
};

export const updateGym = async (gymId, updates) => {
  const token = await getAuthToken();
  const res = await fetch(`${BASE_URL}/${gymId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(updates),
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
