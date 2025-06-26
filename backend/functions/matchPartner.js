import { db } from "../firebase/init.js";
import { getDocs, query, where, collection } from "firebase-admin/firestore"; // ✅ admin SDK

/**
 * Match users with similar time slots and same gym.
 * @param {string} gymId
 * @param {string} preferredTimeSlot - e.g. "18:00"
 * @param {string} userId
 * @returns {Object} success and array of matched partner slots
 */
export const matchPartnerSlots = async ({ gymId, preferredTimeSlot, userId }) => {
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

      // Skip if user's own slot or already joined
      if (
        data.userId === userId ||
        (Array.isArray(data.participants) && data.participants.includes(userId))
      ) {
        return;
      }

      const slotTime = data.timeSlot || "";
      const userHour = parseInt(preferredTimeSlot.split(":")[0], 10);
      const candidateHour = parseInt(slotTime.split(":")[0], 10);

      if (Math.abs(userHour - candidateHour) <= 1) {
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
    console.error("Error matching partner slots:", err.message);
    return {
      success: false,
      error: err.message || "Failed to match partners.",
    };
  }
};
