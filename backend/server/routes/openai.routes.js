// backend/server/routes/openai.routes.js
import express from "express";
import { verifyUser } from "../../utils/authMiddleware.js";
import { generateChatCompletion } from "../../functions/openaiHandler.js";

const router = express.Router();

router.post("/", verifyUser, async (req, res) => {
  const { messages } = req.body;
  if (!Array.isArray(messages)) {
    return res.status(400).json({ error: "Invalid messages array" });
  }

  try {
    const result = await generateChatCompletion({ messages });
    res.json({ success: true, result });
  } catch (err) {
    console.error("OpenAI error:", err.message);
    res.status(500).json({ error: "OpenAI request failed" });
  }
});

export default router;
