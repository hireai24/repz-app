// backend/utils/userUtils.js

import {
  doc,
  getDoc,
  getDocs,
  collection,
  query,
  where,
} from "firebase/firestore";
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
    // Log error only in development
    if (process.env.NODE_ENV !== "production") {
      console.error("getUserTier error:", err);
    }
    return "Free";
  }
};

/**
 * Returns all Expo push tokens for challenge participants excluding sender.
 * This assumes participant documents in 'challengeThreads/{challengeId}/participants' subcollection
 * contain a 'userId' field AND a 'expoPushToken' field (or 'pushToken' field, depending on your schema).
 *
 * It will fetch all participants and then filter out the sender's token.
 *
 * @param {string} challengeId
 * @param {string} senderId
 * @returns {Promise<string[]>} An array of Expo push tokens.
 */
export const getUserPushTokens = async (challengeId, senderId) => {
  try {
    if (!challengeId || !senderId) {
      // console.warn("Missing challengeId or senderId for getUserPushTokens."); // For dev debugging
      return [];
    }

    const participantsCollectionRef = collection(
      db,
      "challengeThreads",
      challengeId,
      "participants",
    );
    const q = query(participantsCollectionRef); // Fetch all participants

    const snapshot = await getDocs(q);
    const tokens = [];

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      // Assuming participant documents have a 'userId' and 'expoPushToken' field
      // Adjust 'userId' to 'id' if the document ID is the userId, or 'expoPushToken' to 'pushToken' if named differently.
      if (
        data.userId && // Assuming userId is a field in the participant doc
        data.userId !== senderId && // Filter out the sender
        data.expoPushToken &&
        typeof data.expoPushToken === "string"
      ) {
        tokens.push(data.expoPushToken);
      }
    });

    return tokens;
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("Failed to get push tokens for challenge:", error);
    }
    return [];
  }
};