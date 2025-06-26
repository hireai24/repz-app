import path from "path";
import fs from "fs/promises";
import { existsSync, mkdirSync } from "fs";
import { fileURLToPath } from "url";

import * as tf from "@tensorflow/tfjs"; // ✅ Switched from tfjs-node
import * as poseDetection from "@tensorflow-models/pose-detection";
import ffmpeg from "fluent-ffmpeg";
import { createCanvas, loadImage } from "canvas";
import { collection, addDoc } from "firebase/firestore";

import { db } from "../firebase/init.js";
import { getOpenAIResponse as callOpenAIApi } from "../utils/openaiHelper.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEMP_DIR = path.join(__dirname, "../../tempFrames");

let detector;

const analyzeForm = async (userId, videoPath, exerciseType, authUser) => {
  if (!authUser?.tier || !["Pro", "Elite"].includes(authUser.tier)) {
    return {
      success: false,
      error: "Upgrade required to access this feature (Form Ghost).",
      status: 403,
    };
  }

  if (!userId || !videoPath || !exerciseType) {
    return {
      success: false,
      error: "Missing or invalid input fields.",
      status: 400,
    };
  }

  if (!videoPath.endsWith(".mp4") && !videoPath.endsWith(".mov")) {
    return {
      success: false,
      error: "Unsupported video format. Only MP4 and MOV allowed.",
      status: 400,
    };
  }

  try {
    if (!existsSync(TEMP_DIR)) mkdirSync(TEMP_DIR, { recursive: true });
    await extractFrames(videoPath, TEMP_DIR);

    if (!detector) {
      detector = await poseDetection.createDetector(
        poseDetection.SupportedModels.MoveNet
      );
    }

    const frames = await fs.readdir(TEMP_DIR);
    const analysisResults = [];

    for (const frameFile of frames) {
      const filePath = path.join(TEMP_DIR, frameFile);

      try {
        const imageBuffer = await fs.readFile(filePath);
        const img = await loadImage(imageBuffer);
        const canvas = createCanvas(img.width, img.height);
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        const tensor = tf.browser.fromPixels(canvas);

        let feedback;
        try {
          const poses = await detector.estimatePoses(tensor);
          feedback = poses[0]
            ? evaluatePose(poses[0], exerciseType)
            : await fallbackAIAnalysis(exerciseType, authUser?.token);
        } catch (frameErr) {
          console.error(`Error analyzing frame ${frameFile}:`, frameErr);
          feedback = {
            status: "Frame analysis error",
            comment: frameErr.message || "Error analyzing frame.",
          };
        } finally {
          tensor.dispose();
        }

        analysisResults.push({ frame: frameFile, feedback });
      } catch (readErr) {
        console.error(`Error reading or processing frame: ${filePath}`, readErr);
        analysisResults.push({
          frame: frameFile,
          feedback: {
            status: "Frame load error",
            comment: readErr.message || "Unable to process frame.",
          },
        });
      }
    }

    if (analysisResults.length > 0) {
      const docRef = await addDoc(collection(db, "formAnalysis"), {
        userId,
        exerciseType,
        videoPath,
        results: analysisResults,
        createdAt: new Date(),
      });
      return { success: true, analysisId: docRef.id, results: analysisResults };
    } else {
      return {
        success: false,
        error: "No frames could be analyzed.",
        status: 400,
      };
    }
  } catch (err) {
    console.error("Error in analyzeForm function:", err);
    return {
      success: false,
      error: err.message || "Unexpected error analyzing form.",
      status: 500,
    };
  } finally {
    try {
      await fs.rm(TEMP_DIR, { recursive: true, force: true });
    } catch (err) {
      console.error("Error cleaning up tempFrames directory:", err);
    }
  }
};

function extractFrames(videoPath, outputDir) {
  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .on("end", () => resolve())
      .on("error", (err) => reject(new Error(`FFmpeg error: ${err.message}`)))
      .screenshots({
        count: 10,
        folder: outputDir,
        filename: "frame-%s.png",
        size: "640x?",
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

async function fallbackAIAnalysis(exerciseType, token) {
  const timeoutMs = 8000;
  const messages = [
    {
      role: "user",
      content: `Analyze the form for a ${exerciseType}. Pose detection was unavailable for this frame. Provide a general form feedback.`,
    },
  ];

  try {
    const aiPromise = callOpenAIApi(messages, token);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Fallback AI timeout")), timeoutMs)
    );
    const result = await Promise.race([aiPromise, timeoutPromise]);
    return {
      status: "Fallback AI analysis",
      comment: result || "No feedback.",
    };
  } catch (err) {
    console.error("Fallback AI analysis failed:", err);
    return {
      status: "Fallback AI analysis failed.",
      comment: err.message || "Unable to analyze frame.",
    };
  }
}

export default analyzeForm;
