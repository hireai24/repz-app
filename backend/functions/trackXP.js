import { doc, getDoc, setDoc, updateDoc, increment } from "firebase/firestore";

import { db } from "../firebase/init.js";
import { calculateStreak } from "../utils/streakUtils.js";
import { calculateWorkoutXP } from "../../src/utils/xpCalculator.js"; // ✅ FIXED path

/**
 * Tracks XP and streaks based on a workout log.
 * Ensures consistent Firestore writes with safe date handling.
 *
 * @param {string} userId - Firebase user ID
 * @param {Object} workoutLog - The logged workout data
 */
const trackXP = async (userId, workoutLog) => {
  if (
    !userId ||
    typeof userId !== "string" ||
    typeof workoutLog !== "object" ||
    !Array.isArray(workoutLog.exercises) ||
    workoutLog.exercises.length === 0
  ) {
    return {
      success: false,
      error: "Invalid input: userId and workoutLog.exercises are required.",
    };
  }

  try {
    const xpRef = doc(db, "xp", userId);
    const xpSnap = await getDoc(xpRef);

    const existing = xpSnap.exists()
      ? xpSnap.data()
      : { xp: 0, streak: 0, lastWorkout: null };

    const { total, breakdown } = calculateWorkoutXP(workoutLog);
    const { updatedStreak, isNewDay } = calculateStreak(existing.lastWorkout);

    const nowISO = new Date().toISOString();
    const updatedData = {
      streak: isNewDay ? updatedStreak : existing.streak,
      lastWorkout: nowISO,
    };

    if (xpSnap.exists()) {
      await updateDoc(xpRef, {
        ...updatedData,
        xp: increment(total),
      });
    } else {
      await setDoc(xpRef, {
        ...updatedData,
        xp: total,
      });
    }

    return {
      success: true,
      xpEarned: total,
      breakdown,
      newStreak: updatedData.streak,
    };
  } catch (err) {
    console.error("🔥 XP tracking failed:", err.message);
    return { success: false, error: err.message || "XP tracking failed." };
  }
};

export default trackXP;
