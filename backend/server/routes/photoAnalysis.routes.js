import express from "express";
import { verifyUser } from "../../utils/authMiddleware.js";
import { analyzePhotoSimilarity } from "../../functions/analyzePhotosWithReplicate.js";

const router = express.Router();

router.post("/", verifyUser, async (req, res) => {
  const { beforeUrl, afterUrl } = req.body;

  if (!beforeUrl || !afterUrl) {
    return res.status(400).json({ error: "Missing image URLs" });
  }

  try {
    const result = await analyzePhotoSimilarity(beforeUrl, afterUrl);
    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }
    res.json(result);
  } catch (err) {
    // TODO: Replace with proper logging utility in production
    res.status(500).json({ error: "Failed to analyze photos" });
  }
});

export default router;
