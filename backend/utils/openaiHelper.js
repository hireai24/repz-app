import dotenv from "dotenv";
dotenv.config();

import fetch from "node-fetch";

/**
 * Fetches a chat completion from your backend OpenAI proxy route.
 * @param {Array} messages - Chat messages array for OpenAI (role/content)
 * @param {string} [token] - Optional bearer token for auth
 * @returns {Promise<any>} - The AI response result
 * @throws {Error} - If the backend or OpenAI request fails
 */
export const getOpenAIResponse = async (messages, token = "") => {
  const response = await fetch(
    `${process.env.EXPO_PUBLIC_API_BASE_URL}/api/openai`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify({ messages }),
    },
  );

  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "AI request failed");

  return data.result;
};
