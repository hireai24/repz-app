// utils/userUtils.js

import { doc, getDoc } from "firebase/firestore";
import { db } from "../../backend/firebase/init";

/**
 * Get the user's subscription tier from Firestore.
 * Defaults to "Free" if missing or error occurs.
 *
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

    if (tier === "Pro" || tier === "Elite") {
      return tier;
    }
    return "Free";
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("getUserTier error:", err);
    return "Free";
  }
};
