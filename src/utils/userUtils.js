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
    const userRef = doc(db, "users", userId);
    const snap = await getDoc(userRef);
    if (!snap.exists()) return "Free";

    const data = snap.data();
    const tier = data.tier;

    if (tier === "Pro" || tier === "Elite") {
      return tier;
    }

    return "Free";
  } catch (err) {
    console.error("getUserTier error:", err);
    return "Free";
  }
};
