// backend/functions/analyzeForm.js

import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

import * as tf from "@tensorflow/tfjs";
import * as poseDetection from "@tensorflow-models/pose-detection";
import ffmpeg from "fluent-ffmpeg";
import { createCanvas, loadImage } from "canvas";
import { collection, addDoc } from "firebase/firestore";

import { db } from "../firebase/init.js";
import { evaluateFormFromTranscript } from "../ai/prompts/formEvaluator.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEMP_DIR = path.join(__dirname, "../../tempFrames");

let detector;

const analyzeForm = async (userId, videoPath, exerciseType) => {
  if (!userId || !videoPath || !exerciseType) {
    return { success: false, error: "Missing or invalid input fields." };
  }

  if (!videoPath.endsWith(".mp4") && !videoPath.endsWith(".mov")) {
    return {
      success: false,
      error: "Unsupported video format. Only MP4 and MOV allowed.",
    };
  }

  try {
    if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });
    await extractFrames(videoPath, TEMP_DIR);

    if (!detector) {
      detector = await poseDetection.createDetector(
        poseDetection.SupportedModels.MoveNet,
      );
    }

    const frames = fs.readdirSync(TEMP_DIR);
    const analysisResults = [];

    for (const frameFile of frames) {
      const filePath = path.join(TEMP_DIR, frameFile);
      const imageBuffer = fs.readFileSync(filePath);
      const img = await loadImage(imageBuffer);
      const canvas = createCanvas(img.width, img.height);
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      const tensor = tf.browser.fromPixels(canvas);

      try {
        const poses = await detector.estimatePoses(tensor);

        const feedback = poses[0]
          ? evaluatePose(poses[0], exerciseType)
          : await fallbackAIAnalysis(exerciseType);

        analysisResults.push({ frame: frameFile, feedback });
      } catch {
        analysisResults.push({
          frame: frameFile,
          feedback: {
            status: "Frame error",
            comment: "Error analyzing frame.",
          },
        });
      } finally {
        tensor.dispose();
      }
    }

    const docRef = await addDoc(collection(db, "formAnalysis"), {
      userId,
      exerciseType,
      videoPath,
      results: analysisResults,
      createdAt: new Date(),
    });

    return { success: true, analysisId: docRef.id, results: analysisResults };
  } catch (err) {
    return {
      success: false,
      error: err.message || "Unexpected error analyzing form.",
    };
  } finally {
    if (fs.existsSync(TEMP_DIR)) {
      fs.rmSync(TEMP_DIR, { recursive: true, force: true });
    }
  }
};

function extractFrames(videoPath, outputDir) {
  return new Promise((resolve, reject) => {
    ffmpeg(videoPath).on("end", resolve).on("error", reject).screenshots({
      count: 10,
      folder: outputDir,
      filename: "frame-%i.png",
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

async function fallbackAIAnalysis(exerciseType) {
  const timeoutMs = 8000;

  try {
    const aiPromise = evaluateFormFromTranscript({
      exercise: exerciseType,
      reps: 1,
      transcript: "Pose detection unavailable for this frame.",
    });

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Fallback AI timeout")), timeoutMs),
    );

    const result = await Promise.race([aiPromise, timeoutPromise]);
    return result.feedback || { status: "Fallback analysis incomplete." };
  } catch {
    return {
      status: "Fallback AI analysis failed.",
      comment: "Unable to analyze frame.",
    };
  }
}

export default analyzeForm;
export const analyzeFormTranscript = analyzeForm;
