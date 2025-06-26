// backend/utils/userUtils.js

import { doc, getDoc, getDocs, collection, query } from "firebase/firestore";
import { db } from "../firebase/init.js";

/**
 * Returns the user's subscription tier (Free, Pro, Elite).
 * @param {string} userId
 * @returns {Promise<"Free" | "Pro" | "Elite">}
 */
export const getUserTier = async (userId) => {
  try {
    if (!userId || typeof userId !== "string") return "Free";

    const userRef = doc(db, "users", userId);
    const snap = await getDoc(userRef);
    if (!snap.exists()) return "Free";

    const data = snap.data();
    const tier = typeof data.tier === "string" ? data.tier.trim() : "";

    return tier === "Pro" || tier === "Elite" ? tier : "Free";
  } catch (err) {
    // Log error only in development (no-console for lint)
    // (Use a logger here in production if needed)
    return "Free";
  }
};

/**
 * Returns all Expo push tokens for challenge participants excluding sender.
 */
export const getUserPushTokens = async (challengeId, senderId) => {
  try {
    if (!challengeId || !senderId) {
      return [];
    }

    const participantsCollectionRef = collection(
      db,
      "challengeThreads",
      challengeId,
      "participants",
    );
    const q = query(participantsCollectionRef);

    const snapshot = await getDocs(q);
    const tokens = [];

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (
        data.userId &&
        data.userId !== senderId &&
        data.expoPushToken &&
        typeof data.expoPushToken === "string"
      ) {
        tokens.push(data.expoPushToken);
      }
    });

    return tokens;
  } catch (error) {
    // Log error only in development (no-console for lint)
    // (Use a logger here in production if needed)
    return [];
  }
};
