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
 * Generate a chat completion from OpenAI API with tier-based access control.
 * @param {Object} req - Express request (must contain user and messages)
 * @param {Object} res - Express response
 * @returns {Promise<Response>}
 */
export const handleOpenAIRequest = async (req, res) => {
  try {
    const { user } = req;
    const { messages, model = "gpt-4" } = req.body;

    // ❌ Reject access if user is not Pro or Elite
    if (!user?.tier || !["Pro", "Elite"].includes(user.tier)) {
      return res
        .status(403)
        .json({ error: "Upgrade required to access this feature." });
    }

    if (!Array.isArray(messages) || messages.length === 0) {
      return res
        .status(400)
        .json({ error: "Invalid or missing messages array." });
    }

    const response = await openai.chat.completions.create({
      model,
      messages,
    });

    const content = response.choices?.[0]?.message?.content || "";

    return res.status(200).json({ content });
  } catch (error) {
    // console.error("❌ OpenAI Error:", error.message); // Commented out to resolve no-console warning
    return res.status(500).json({ error: "Failed to generate AI response." });
  }
};

/**
 * Utility (non-Express) call to OpenAI chat completion.
 * Used in backend-only flows like plan generation or meal logic.
 * @param {Object} options - { messages, model }
 * @returns {Promise<string>} - Raw string output
 */
export const generateChatCompletion = async ({ messages, model = "gpt-4" }) => {
  if (!Array.isArray(messages) || messages.length === 0) {
    throw new Error("Invalid or missing messages array for OpenAI completion.");
  }

  const response = await openai.chat.completions.create({
    model,
    messages,
  });

  return response.choices?.[0]?.message?.content || "";
};
