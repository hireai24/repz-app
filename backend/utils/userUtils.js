// backend/utils/userUtils.js

import { doc, getDoc } from "firebase/firestore";
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

    if (tier === "Pro" || tier === "Elite") return tier;
    return "Free";
  } catch {
    return "Free";
  }
};
