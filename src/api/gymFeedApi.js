// src/api/gymFeedApi.js
import axios from "axios";
import { getAuthToken } from "../firebase/firebaseClient";

const API_BASE = `${process.env.EXPO_PUBLIC_API_URL}/api/gym-feed`;

export const getGymFeed = async (gymId) => {
  const res = await axios.get(`${API_BASE}/${gymId}`);
  return res.data;
};

export const createGymFeedPost = async ({ gymId, text, imageUrl, offer }) => {
  const token = await getAuthToken();
  const res = await axios.post(
    `${API_BASE}/`,
    { gymId, text, imageUrl, offer },
    { headers: { Authorization: `Bearer ${token}` } },
  );
  return res.data;
};

export const deleteGymFeedPost = async (postId) => {
  const token = await getAuthToken();
  const res = await axios.delete(`${API_BASE}/${postId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};
