// backend/functions/generateDailyChallenge.js

import { db } from "../firebase/init.js";
import { doc, setDoc, Timestamp } from "firebase/firestore";
import { getUserTier } from "../utils/userUtils.js";
import { generatePushupsChallenge, generateVolumeChallenge } from "../utils/challengeGenerators.js";

/**
 * Generates a daily AI challenge for the user based on tier and activity.
 * Stores it under /dailyChallenges/{userId}
 */
const generateDailyChallenge = async (req, res) => {
  const userId = req.user?.uid;

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const tier = await getUserTier(userId);
    let challenge;

    // Generate challenge based on tier
    switch (tier) {
      case "Elite":
        challenge = generateVolumeChallenge({ minVolume: 3000 });
        break;
      case "Pro":
        challenge = generateVolumeChallenge({ minVolume: 2000 });
        break;
      default:
        challenge = generatePushupsChallenge({ reps: 30 });
        break;
    }

    const challengeData = {
      ...challenge,
      userId,
      createdAt: Timestamp.now(),
      completed: false,
    };

    await setDoc(doc(db, "dailyChallenges", userId), challengeData);

    res.status(200).json({ success: true, challenge: challengeData });
  } catch (err) {
    console.error("generateDailyChallenge error:", err);
    res.status(500).json({ error: "Failed to generate challenge." });
  }
};

export default generateDailyChallenge;
