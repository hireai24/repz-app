import path from "path";
import fs from "fs";
import { tmpdir } from "os";
import { v4 as uuidv4 } from "uuid";
import fetch from "node-fetch";
import admin from "firebase-admin";
import { evaluateForm } from "../utils/analyzeFormUtils.js";

const db = admin.firestore();

const downloadVideoToTemp = async (videoUrl) => {
  const tempFilename = path.join(tmpdir(), `form-${uuidv4()}.mp4`);
  const res = await fetch(videoUrl);
  const fileStream = fs.createWriteStream(tempFilename);

  await new Promise((resolve, reject) => {
    res.body.pipe(fileStream);
    res.body.on("error", reject);
    fileStream.on("finish", resolve);
  });

  return tempFilename;
};

const analyzeChallengeForm = async (req, res) => {
  let localPath = null;
  try {
    const { challengeId, userId, videoUrl } = req.body;

    if (!challengeId || !userId || !videoUrl) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields.",
      });
    }

    localPath = await downloadVideoToTemp(videoUrl);

    const verdict = await evaluateForm(localPath, userId, challengeId);

    const updateData = {
      verdict,
      verifiedByAI: true,
      verifiedAt: new Date().toISOString(),
    };

    if (verdict === "flagged") {
      updateData.flagged = true;
    }

    await db
      .collection("wagerChallenges")
      .doc(challengeId)
      .collection("submissions")
      .doc(userId)
      .set(updateData, { merge: true });

    if (localPath && fs.existsSync(localPath)) {
      fs.unlinkSync(localPath);
    }

    return res.status(200).json({ success: true, verdict });
  } catch (err) {
    if (localPath && fs.existsSync(localPath)) {
      try {
        fs.unlinkSync(localPath);
      } catch (cleanupError) {
        // eslint-disable-next-line no-console
        console.error("Error cleaning up temp file:", cleanupError);
      }
    }
    // eslint-disable-next-line no-console
    console.error("Error in analyzeChallengeForm:", err);
    return res.status(500).json({
      success: false,
      error: "Internal server error.",
    });
  }
};

export default analyzeChallengeForm;
