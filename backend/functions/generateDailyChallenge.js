// backend/functions/generateDailyChallenge.js

import { db } from "../firebase/init.js";
import { doc, setDoc } from "firebase/firestore";
import { getUserTier } from "../utils/userUtils.js";
import {
  generatePushupsChallenge as generateBackendPushupsChallenge,
  generateVolumeChallenge as generateBackendVolumeChallenge,
} from "../utils/challengeGenerators.js";

/**
 * Generates a daily AI challenge for the user based on tier and activity.
 * Stores it under /dailyChallenges/{userId}
 * @route POST /api/daily-challenge/generate
 * @access Private (Assumes authentication middleware is applied)
 */
const generateDailyChallenge = async (req, res) => {
  const userId = req.user?.uid;

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized: User ID not found." });
  }

  try {
    const tier = await getUserTier(userId);
    let challenge;

    // Generate challenge based on tier, passing userId
    switch (tier) {
      case "Elite":
        challenge = generateBackendVolumeChallenge(userId, { minVolume: 3000 });
        break;
      case "Pro":
        challenge = generateBackendVolumeChallenge(userId, { minVolume: 2000 });
        break;
      default:
        challenge = generateBackendPushupsChallenge(userId, { reps: 30 });
        break;
    }

    // Save challenge directly, assuming challengeGenerators already includes assignedTo, createdAt, etc.
    await setDoc(doc(db, "dailyChallenges", userId), {
      ...challenge,
      completed: false, // Force to false in DB regardless of generator
    });

    res.status(200).json({ success: true, challenge });
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.error(
        "Error generating daily challenge for user",
        userId,
        ":",
        err,
      );
    }
    res.status(500).json({ error: "Failed to generate daily challenge." });
  }
};

export default generateDailyChallenge;
