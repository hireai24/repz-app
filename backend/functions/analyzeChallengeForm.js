import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { tmpdir } from "os";
import { v4 as uuidv4 } from "uuid";
import ffmpeg from "fluent-ffmpeg";
import fetch from "node-fetch";
import admin from "firebase-admin";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

import { evaluateForm } from "../utils/analyzeFormUtils.js";

// === Resolve secure Firebase Admin key path ===
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const keyPath = path.resolve(__dirname, "../secure/firebase-admin-key.json");

// === Load and parse key from file ===
if (!fs.existsSync(keyPath)) {
  throw new Error("❌ Firebase Admin key file not found: " + keyPath);
}
const serviceAccount = JSON.parse(fs.readFileSync(keyPath, "utf-8"));

// === Initialize Firebase Admin SDK ===
if (!admin.apps.length) {
  initializeApp({ credential: cert(serviceAccount) });
}
const db = getFirestore();

/**
 * Downloads video from a URL to a temporary file.
 */
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

/**
 * Analyzes a challenge submission video using TensorFlow form model.
 * Updates Firestore with verdict and flags if needed.
 */
const analyzeChallengeForm = async (req, res) => {
  try {
    const { challengeId, userId, videoUrl } = req.body;

    if (!challengeId || !userId || !videoUrl) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields.",
      });
    }

    const localPath = await downloadVideoToTemp(videoUrl);
    const verdict = await evaluateForm(localPath);

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

    fs.unlinkSync(localPath); // 🧼 Clean up video file

    return res.status(200).json({ success: true, verdict });
  } catch (err) {
    console.error("🔥 Form analysis failed:", err.message || err);
    return res.status(500).json({
      success: false,
      error: "Internal server error.",
    });
  }
};

export default analyzeChallengeForm;
