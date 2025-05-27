// backend/functions/analyzeChallengeForm.js

import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { tmpdir } from "os";
import { v4 as uuidv4 } from "uuid";
import fetch from "node-fetch";
import admin from "firebase-admin";

import { evaluateForm } from "../utils/analyzeFormUtils.js";

// === Resolve Firebase key location ===
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const keyPath = path.resolve(__dirname, "../secure/firebase-admin-key.json");

// === Load key ===
if (!fs.existsSync(keyPath)) {
  throw new Error("❌ Firebase Admin key file not found: " + keyPath);
}
const serviceAccount = JSON.parse(fs.readFileSync(keyPath, "utf-8"));

// === Initialize admin app if not already ===
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

/**
 * Download video from a URL to a temp file.
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
 * Analyze a challenge video and update verdict in Firestore.
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

    fs.unlinkSync(localPath);

    return res.status(200).json({ success: true, verdict });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: "Internal server error.",
    });
  }
};

export default analyzeChallengeForm;
