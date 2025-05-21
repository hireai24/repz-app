import express from "express";
import multer from "multer";
import { analyzeFormTranscript } from "../../functions/analyzeForm.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" }); // Temporary upload folder

/**
 * POST /api/form/analyze
 * Handles form video uploads and triggers pose analysis.
 * Expects multipart/form-data with fields:
 * - video: file (MP4/MOV)
 * - userId: string
 * - exerciseType: string
 */
router.post("/analyze", upload.single("video"), async (req, res) => {
  try {
    const { userId, exerciseType } = req.body;
    const file = req.file;

    if (!file || !userId || !exerciseType) {
      return res.status(400).json({ success: false, error: "Missing required fields or video file." });
    }

    const result = await analyzeForm(userId, file.path, exerciseType);

    if (!result.success) {
      return res.status(400).json({ success: false, error: result.error || "Analysis failed." });
    }

    res.status(200).json(result);
  } catch (err) {
    console.error("🔥 Error in /api/form/analyze:", err.message);
    res.status(500).json({ success: false, error: "Internal server error." });
  }
});

export default router;
