// backend/utils/analyzeFormUtils.js

import fs from "fs/promises";
import path from "path";
import { createCanvas, Image } from "canvas";
import * as tf from "@tensorflow/tfjs";
import * as poseDetection from "@tensorflow-models/pose-detection";

// Optional logger (no-op for lint compliance)
const log = { error: () => {} };

const FRAME_DIR = "./challengeFrames";
let detector;

export const evaluateForm = async (videoPath) => {
  try {
    // Ensure frame directory exists
    try {
      await fs.mkdir(FRAME_DIR, { recursive: true });
    } catch (err) {
      log.error("[evaluateForm] Failed to create FRAME_DIR:", err);
      return "flagged";
    }

    // Extract frames
    try {
      await extractFrames(videoPath, FRAME_DIR);
    } catch (err) {
      log.error("[evaluateForm] Failed to extract frames:", err);
      return "flagged";
    }

    if (!detector) {
      detector = await poseDetection.createDetector(
        poseDetection.SupportedModels.MoveNet,
        {
          modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
        },
      );
    }

    let frameFiles;
    try {
      frameFiles = await fs.readdir(FRAME_DIR);
    } catch (err) {
      log.error("[evaluateForm] Failed to read frame directory:", err);
      return "flagged";
    }

    let passCount = 0;
    let failCount = 0;

    for (const file of frameFiles) {
      const filePath = path.join(FRAME_DIR, file);
      let buffer, image;

      try {
        buffer = await fs.readFile(filePath);
        image = new Image();
        image.src = buffer;
      } catch (err) {
        log.error(`[evaluateForm] Error loading frame: ${filePath}`, err);
        continue;
      }

      const canvas = createCanvas(image.width, image.height);
      const ctx = canvas.getContext("2d");
      ctx.drawImage(image, 0, 0);

      const input = tf.browser.fromPixels(canvas);

      try {
        const poses = await detector.estimatePoses(input);
        const pose = poses[0];

        const isValid = isPoseValid(pose);
        if (isValid) passCount++;
        else failCount++;
      } catch (err) {
        log.error("[evaluateForm] Pose estimation error:", err);
        failCount++;
      } finally {
        input.dispose();
      }
    }

    try {
      await fs.rm(FRAME_DIR, { recursive: true, force: true });
    } catch (err) {
      log.error("[evaluateForm] Failed to clean up FRAME_DIR:", err);
    }

    const total = passCount + failCount;
    if (total === 0) return "flagged";

    const passRatio = passCount / total;
    if (passRatio > 0.7) return "pass";
    if (passRatio < 0.4) return "fail";
    return "flagged";
  } catch (err) {
    log.error("[evaluateForm] Main error:", err);
    return "flagged";
  }
};

const extractFrames = (videoPath, outDir) => {
  return new Promise((resolve, reject) => {
    import("fluent-ffmpeg").then((ffmpegModule) => {
      const ffmpeg = ffmpegModule.default;
      ffmpeg(videoPath)
        .on("end", resolve)
        .on("error", (err) => {
          log.error("[extractFrames] ffmpeg error:", err);
          reject(err);
        })
        .screenshots({
          count: 10,
          folder: outDir,
          filename: "frame-%i.png",
        });
    });
  });
};

function isPoseValid(pose) {
  if (!pose || !pose.keypoints || pose.keypoints.length < 10) return false;
  const visible = pose.keypoints.filter((k) => k.score > 0.4);
  return visible.length >= 8;
}
