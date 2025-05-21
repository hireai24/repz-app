// backend/functions/openaiHandler.js
import OpenAI from "openai";
import dotenv from "dotenv";
dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const generateChatCompletion = async ({ messages, model = "gpt-4" }) => {
  const response = await openai.chat.completions.create({ model, messages });
  return response.choices[0].message.content;
};
