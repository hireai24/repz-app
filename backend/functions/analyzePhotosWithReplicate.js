import Replicate from "replicate";
import dotenv from "dotenv";
dotenv.config();

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

/**
 * Uses Replicate's CLIP model to compare two images.
 * Returns a similarity score and text interpretation.
 */
export const analyzePhotoSimilarity = async (beforeUrl, afterUrl) => {
  try {
    const output = await replicate.run("openai/clip", {
      input: {
        image_1: beforeUrl,
        image_2: afterUrl,
      },
    });

    const { similarity } = output;

    return {
      success: true,
      similarity: similarity.toFixed(2),
      message:
        similarity > 0.9
          ? "Minimal visible change detected. Stay consistent!"
          : similarity < 0.6
            ? "Significant visual transformation detected! Great job."
            : "Some visual change detected. Progress is happening!",
    };
  } catch (err) {
    // Error silenced for production
    return {
      success: false,
      error: err.message || "Replicate photo comparison failed.",
    };
  }
};
