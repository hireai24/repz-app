// backend/utils/openaiHelper.js

import OpenAI from "openai";

const openAiApiKey = process.env.OPENAI_API_KEY;
if (!openAiApiKey) {
  throw new Error("❌ Missing OPENAI_API_KEY environment variable.");
}

const openai = new OpenAI({ apiKey: openAiApiKey });

/**
 * Get a chat completion from OpenAI directly.
 * @param {Array} messages - Array of chat messages for OpenAI ([{role, content}])
 * @param {string} [model="gpt-3.5-turbo"] - Model to use
 * @returns {Promise<string>} - AI response text
 * @throws {Error} - If OpenAI request fails
 */
export const getOpenAIResponse = async (messages, model = "gpt-3.5-turbo") => {
  try {
    const response = await openai.chat.completions.create({
      model,
      messages,
      temperature: 0.7,
    });

    const message =
      response?.choices?.[0]?.message?.content ||
      response?.choices?.[0]?.content ||
      "";
    return message.trim();
  } catch (err) {
    throw new Error(
      err?.error?.message ||
        err?.message ||
        "Unknown error from OpenAI in getOpenAIResponse",
    );
  }
};
