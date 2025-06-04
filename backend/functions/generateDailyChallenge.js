// backend/functions/generateDailyChallenge.js

import { db } from "../firebase/init.js";
import { doc, setDoc, Timestamp } from "firebase/firestore";
import { getUserTier } from "../utils/userUtils.js";
import {
  generatePushupsChallenge as generateBackendPushupsChallenge, // Rename to avoid conflict with frontend util
  generateVolumeChallenge as generateBackendVolumeChallenge, // Rename to avoid conflict with frontend util
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
        // Ensure that generateBackendVolumeChallenge accepts a userId parameter
        challenge = generateBackendVolumeChallenge(userId, { minVolume: 3000 });
        break;
      case "Pro":
        // Ensure that generateBackendVolumeChallenge accepts a userId parameter
        challenge = generateBackendVolumeChallenge(userId, { minVolume: 2000 });
        break;
      default:
        // Ensure that generateBackendPushupsChallenge accepts a userId parameter
        challenge = generateBackendPushupsChallenge(userId, { reps: 30 });
        break;
    }

    const challengeData = {
      ...challenge,
      userId, // Redundant if challenge object already has assignedTo/createdBy with userId
      createdAt: Timestamp.now(),
      completed: false,
      // The `id` will come from the generator function
    };

    await setDoc(doc(db, "dailyChallenges", userId), challengeData);

    res.status(200).json({ success: true, challenge: challengeData });
  } catch (err) {
    console.error("Error generating daily challenge for user", userId, ":", err); // Log the actual error
    res.status(500).json({ error: "Failed to generate daily challenge." });
  }
};

export default generateDailyChallenge;