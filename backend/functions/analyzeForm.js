// backend/functions/analyzeForm.js

import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { promisify } from 'util'; // ADDED: for fs.unlink

import * as tf from "@tensorflow/tfjs-node"; // CHANGED: Use tfjs-node for backend
import * as poseDetection from "@tensorflow-models/pose-detection";
import ffmpeg from "fluent-ffmpeg";
import { createCanvas, loadImage } from "canvas";
import { collection, addDoc } from "firebase/firestore";

import { db } from "../firebase/init.js";
import { getOpenAIResponse as callOpenAIApi } from "../utils/openaiHelper.js"; // CHANGED: Use openaiHelper
// import { evaluateFormFromTranscript } from "../ai/prompts/formEvaluator.js"; // REMOVED: Now call directly

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEMP_DIR = path.join(__dirname, "../../tempFrames");

// Ensure ffmpeg path is set if not in PATH (e.g., on Windows)
// ffmpeg.setFfmpegPath('/path/to/ffmpeg');
// ffmpeg.setFfprobePath('/path/to/ffprobe');

let detector;

/**
 * Analyze exercise form using pose detection or fallback AI.
 * @param {string} userId
 * @param {string} videoPath - Local path to the video file (from multer)
 * @param {string} exerciseType
 * @param {Object} authUser - User object from verifyUser middleware (contains tier info)
 * @returns {Object} { success, analysisId, results, error?, status? }
 */
const analyzeForm = async (userId, videoPath, exerciseType, authUser) => { // ADDED: authUser param
  // 🔐 Enforce tier access
  if (!authUser?.tier || !["Pro", "Elite"].includes(authUser.tier)) {
    return {
      success: false,
      error: "Upgrade required to access this feature (Form Ghost).",
      status: 403, // Add status for route handler
    };
  }

  if (!userId || !videoPath || !exerciseType) {
    return { success: false, error: "Missing or invalid input fields.", status: 400 };
  }

  if (!videoPath.endsWith(".mp4") && !videoPath.endsWith(".mov")) {
    return {
      success: false,
      error: "Unsupported video format. Only MP4 and MOV allowed.",
      status: 400,
    };
  }

  // Use promisify for fs.rmSync to make it async for finally block
  const unlinkAsync = promisify(fs.unlink);
  const rmAsync = promisify(fs.rm); // For Node.js 14+

  try {
    if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });

    await extractFrames(videoPath, TEMP_DIR);

    if (!detector) {
      // Use tfjs-node backend
      // await tf.setBackend('tensorflow'); // Optional, but can force backend.
      detector = await poseDetection.createDetector(
        poseDetection.SupportedModels.MoveNet,
        // Optional detector config
        // { modelType: poseDetection.movenet.modelType.SINGLEPOSE_THUNDER }
      );
    }

    const frames = fs.readdirSync(TEMP_DIR);
    const analysisResults = [];
    let allFramesAnalyzedSuccessfully = true;

    for (const frameFile of frames) {
      const filePath = path.join(TEMP_DIR, frameFile);
      // Ensure file exists before reading
      if (!fs.existsSync(filePath)) {
          console.warn(`Frame file not found: ${filePath}, skipping.`);
          continue;
      }
      const imageBuffer = fs.readFileSync(filePath);
      const img = await loadImage(imageBuffer);
      const canvas = createCanvas(img.width, img.height);
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      const tensor = tf.browser.fromPixels(canvas); // Still tf.browser for canvas integration

      try {
        const poses = await detector.estimatePoses(tensor);

        const feedback = poses[0]
          ? evaluatePose(poses[0], exerciseType)
          : await fallbackAIAnalysis(exerciseType, authUser?.token); // PASSED: authUser.token

        analysisResults.push({ frame: frameFile, feedback });
      } catch (frameErr) {
        console.error(`Error analyzing frame ${frameFile}:`, frameErr);
        allFramesAnalyzedSuccessfully = false;
        analysisResults.push({
          frame: frameFile,
          feedback: {
            status: "Frame analysis error",
            comment: frameErr.message || "Error analyzing frame.",
          },
        });
      } finally {
        tensor.dispose();
      }
    }

    // Only add to Firestore if at least some analysis was successful
    if (analysisResults.length > 0) {
      const docRef = await addDoc(collection(db, "formAnalysis"), {
        userId,
        exerciseType,
        videoPath, // Path to the original video (might be a temp path or a URL if passed differently)
        results: analysisResults,
        createdAt: new Date(),
      });
      return { success: true, analysisId: docRef.id, results: analysisResults };
    } else {
      return { success: false, error: "No frames could be analyzed.", status: 400 };
    }
  } catch (err) {
    console.error("Error in analyzeForm function:", err); // Server-side debugging
    return {
      success: false,
      error: err.message || "Unexpected error analyzing form.",
      status: 500,
    };
  } finally {
    if (fs.existsSync(TEMP_DIR)) {
      try {
        await rmAsync(TEMP_DIR, { recursive: true, force: true }); // Use async rm
      } catch (err) {
        console.error("Error cleaning up tempFrames directory:", err);
      }
    }
  }
};

// --- Helper Functions (Remaining unchanged in logic) ---

function extractFrames(videoPath, outputDir) {
  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .on("end", () => resolve())
      .on("error", (err) => reject(new Error(`FFmpeg error: ${err.message}`)))
      .screenshots({
        count: 10, // Extract 10 frames
        folder: outputDir,
        filename: "frame-%s.png", // Use %s for timestamp for unique names
        size: '640x?', // Scale frames to 640px width, maintaining aspect ratio
      });
  });
}

function evaluatePose(pose, exerciseType) {
  if (!pose || !pose.keypoints) return { status: "No pose detected." };

  const keypoints = pose.keypoints.reduce((acc, kp) => {
    acc[kp.name] = kp;
    return acc;
  }, {});

  switch (exerciseType.toLowerCase()) {
    case "squat":
    case "back squat":
    case "front squat":
      return evaluateSquat(keypoints);
    case "push-up":
      return evaluatePushUp(keypoints);
    case "deadlift":
      return evaluateDeadlift(keypoints);
    default:
      return {
        status: "Unsupported exercise type for direct pose evaluation.",
        comment: "Using fallback AI analysis instead.",
      };
  }
}

function evaluateSquat(keypoints) {
  const hip = keypoints.left_hip || keypoints.right_hip;
  const knee = keypoints.left_knee || keypoints.right_knee;

  if (!hip || !knee) {
    return { status: "Insufficient keypoints for squat evaluation." };
  }

  const depth = hip.y > knee.y ? "Good depth" : "Shallow squat";
  const score = hip.y > knee.y ? 9 : 5;

  return {
    repScore: score,
    comment:
      depth === "Good depth"
        ? "Strong squat depth and control."
        : "Aim for deeper squat range.",
    depth,
  };
}

function evaluatePushUp(keypoints) {
  const wrist = keypoints.left_wrist || keypoints.right_wrist;
  const elbow = keypoints.left_elbow || keypoints.right_elbow;
  const shoulder = keypoints.left_shoulder || keypoints.right_shoulder;

  if (!wrist || !elbow || !shoulder) {
    return { status: "Insufficient keypoints for push-up evaluation." };
  }

  const elbowDepth = Math.abs(elbow.y - wrist.y);
  const score = elbowDepth < 50 ? 9 : 5;

  return {
    repScore: score,
    comment:
      elbowDepth < 50
        ? "Good push-up depth and tempo."
        : "Lower further to improve range of motion.",
  };
}

function evaluateDeadlift(keypoints) {
  const hip = keypoints.left_hip || keypoints.right_hip;
  const knee = keypoints.left_knee || keypoints.right_knee;
  const ankle = keypoints.left_ankle || keypoints.right_ankle;

  if (!hip || !knee || !ankle) {
    return { status: "Insufficient keypoints for deadlift evaluation." };
  }

  const hipHeight = hip.y;
  const kneeHeight = knee.y;
  const neutralSpine = hipHeight < kneeHeight;

  const score = neutralSpine ? 9 : 5;

  return {
    repScore: score,
    comment: neutralSpine
      ? "Solid deadlift posture."
      : "Maintain flatter back during pull.",
  };
}

// Fallback AI analysis using openaiHelper
async function fallbackAIAnalysis(exerciseType, token) { // PASSED: token
  const timeoutMs = 8000;
  const messages = [{ role: "user", content: `Analyze the form for a ${exerciseType}. Pose detection was unavailable for this frame. Provide a general form feedback.` }];

  try {
    const aiPromise = callOpenAIApi(messages, token); // Use openaiHelper
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Fallback AI timeout")), timeoutMs),
    );

    const result = await Promise.race([aiPromise, timeoutPromise]);
    return { status: "Fallback AI analysis", comment: result || "No feedback." }; // Return structured feedback
  } catch (err) {
    console.error("Fallback AI analysis failed:", err); // Server-side debugging
    return {
      status: "Fallback AI analysis failed.",
      comment: err.message || "Unable to analyze frame.",
    };
  }
}

export default analyzeForm;
// export const analyzeFormTranscript = analyzeForm; // This export is redundant if default is used