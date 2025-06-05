import { db } from "../firebase/init.js";
import { collection, query, where, getDocs } from "firebase/firestore";

/**
 * Match users with similar time slots and same gym.
 * @param {string} gymId
 * @param {string} preferredTimeSlot - e.g. "18:00"
 * @param {string} userId
 * @returns {Array} matched partner slots
 */
export const matchPartnerSlots = async ({
  gymId,
  preferredTimeSlot,
  userId,
}) => {
  try {
    if (!gymId || !preferredTimeSlot || !userId) {
      throw new Error("Missing gymId, timeSlot or userId.");
    }

    const slotsRef = collection(db, "partnerSlots");
    const q = query(slotsRef, where("gymId", "==", gymId));

    const snapshot = await getDocs(q);
    const candidates = [];

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();

      // Exclude user's own slots and slots they've already joined
      if (
        data.userId === userId ||
        (Array.isArray(data.participants) && data.participants.includes(userId))
      )
        return;

      const slotTime = data.timeSlot || "";

      // Simple time window filter (same hour ±1 hour)
      const hourOnly = parseInt(preferredTimeSlot.split(":")[0], 10);
      const candidateHour = parseInt(slotTime.split(":")[0], 10);
      const hourDiff = Math.abs(hourOnly - candidateHour);

      if (hourDiff <= 1) {
        candidates.push({
          id: docSnap.id,
          ...data,
        });
      }
    });

    return {
      success: true,
      matches: candidates,
    };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Error matching partner slots:", err.message);
    return {
      success: false,
      error: err.message || "Failed to match partners.",
    };
  }
};
