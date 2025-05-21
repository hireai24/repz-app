// src/api/aiApi.js
import AsyncStorage from "@react-native-async-storage/async-storage";

export const getOpenAIResponse = async (messages) => {
  const token = await AsyncStorage.getItem("authToken");

  const res = await fetch(`${process.env.EXPO_PUBLIC_API_BASE_URL}/api/openai`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ messages }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "AI call failed");
  return data.result;
};
