import fs from "fs";
import path from "path";
import { createCanvas, Image } from "canvas";
import * as tf from "@tensorflow/tfjs"; // ✅ Pure JS version
import * as poseDetection from "@tensorflow-models/pose-detection";

const FRAME_DIR = "./challengeFrames";
let detector;

/**
 * Main evaluation logic for a challenge video.
 * Returns "pass", "fail", or "flagged"
 */
export const evaluateForm = async (videoPath) => {
  try {
    if (!fs.existsSync(FRAME_DIR)) {
      fs.mkdirSync(FRAME_DIR);
    }

    await extractFrames(videoPath, FRAME_DIR);

    if (!detector) {
      detector = await poseDetection.createDetector(
        poseDetection.SupportedModels.MoveNet,
        {
          modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
        },
      );
    }

    const frameFiles = fs.readdirSync(FRAME_DIR);
    let passCount = 0;
    let failCount = 0;

    for (const file of frameFiles) {
      const filePath = path.join(FRAME_DIR, file);
      const buffer = fs.readFileSync(filePath);
      const image = new Image();
      image.src = buffer;

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
      } catch {
        // Pose estimation error silenced for production
      } finally {
        input.dispose();
      }
    }

    fs.rmSync(FRAME_DIR, { recursive: true, force: true });

    const total = passCount + failCount;
    if (total === 0) return "flagged";

    const passRatio = passCount / total;

    if (passRatio > 0.7) return "pass";
    if (passRatio < 0.4) return "fail";
    return "flagged";
  } catch {
    // Main error silenced for production
    return "flagged";
  }
};

/**
 * Use ffmpeg to extract 10 frames
 */
const extractFrames = (videoPath, outDir) => {
  return new Promise((resolve, reject) => {
    import("fluent-ffmpeg").then((ffmpegModule) => {
      const ffmpeg = ffmpegModule.default;
      ffmpeg(videoPath).on("end", resolve).on("error", reject).screenshots({
        count: 10,
        folder: outDir,
        filename: "frame-%i.png",
      });
    });
  });
};

/**
 * Simple rule: detect whether pose has basic structure
 */
function isPoseValid(pose) {
  if (!pose || !pose.keypoints || pose.keypoints.length < 10) return false;

  const visible = pose.keypoints.filter((k) => k.score > 0.4);
  return visible.length >= 8;
}
