// backend/functions/openaiHandler.js

import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  throw new Error("❌ Missing OPENAI_API_KEY environment variable.");
}

const openai = new OpenAI({ apiKey });

/**
 * Generate a chat completion from OpenAI API.
 * @param {Object} options - { messages, model }
 * @returns {Promise<string>} - The response content
 */
export const generateChatCompletion = async ({ messages, model = "gpt-4" }) => {
  if (!Array.isArray(messages) || !messages.length) {
    throw new Error("Invalid or missing messages array for OpenAI completion.");
  }
  const response = await openai.chat.completions.create({ model, messages });
  return response.choices?.[0]?.message?.content || "";
};
