import { doc, getDoc, setDoc, updateDoc, increment } from "firebase/firestore";

import { db } from "../firebase/init.js";
import calculateStreak from "../utils/streakUtils.js";
import {calculateWorkoutXP} from "../utils/xpCalculator.js";

/**
 * Tracks XP and streaks for either workouts or battle wins.
 *
 * @param {string} userId - Firebase UID
 * @param {Object} data - Workout log or battle context
 * @param {("workout"|"battle")} [mode="workout"] - Type of XP being awarded
 */
const trackXP = async (userId, data, mode = "workout") => {

  if (!userId || typeof userId !== "string") {
    return { success: false, error: "Invalid user ID." };
  }

  try {
    const xpRef = doc(db, "xp", userId);
    const xpSnap = await getDoc(xpRef);
    const existing = xpSnap.exists()
      ? xpSnap.data()
      : { xp: 0, streak: 0, lastWorkout: null };

    const nowISO = new Date().toISOString();

    if (mode === "workout") {
      if (
        !data ||
        !Array.isArray(data.exercises) ||
        data.exercises.length === 0
      ) {
        return { success: false, error: "Workout log must include exercises." };
      }

      const { total, breakdown } = calculateWorkoutXP(data);
      const { updatedStreak, isNewDay } = calculateStreak(existing.lastWorkout);

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
        mode,
        xpEarned: total,
        breakdown,
        newStreak: updatedData.streak,
      };
    }

    if (mode === "battle") {
      const { xpAmount = 0, won = false } = data;

      if (!won || xpAmount <= 0) {
        return {
          success: false,
          error: "Battle reward invalid or not earned.",
        };
      }

      const statsRef = doc(db, "battleStats", userId);
      const statsSnap = await getDoc(statsRef);
      const stats = statsSnap.exists()
        ? statsSnap.data()
        : { wins: 0, losses: 0, currentStreak: 0, bestStreak: 0 };

      const newStreak = stats.currentStreak + 1;
      const bestStreak = Math.max(stats.bestStreak || 0, newStreak);

      await Promise.all([
        xpSnap.exists()
          ? updateDoc(xpRef, { xp: increment(xpAmount) })
          : setDoc(xpRef, { xp: xpAmount }),
        statsSnap.exists()
          ? updateDoc(statsRef, {
              wins: increment(1),
              currentStreak: newStreak,
              bestStreak,
            })
          : setDoc(statsRef, {
              wins: 1,
              losses: 0,
              currentStreak: 1,
              bestStreak: 1,
            }),
      ]);

      return {
        success: true,
        mode,
        xpEarned: xpAmount,
        winStreak: newStreak,
        bestStreak,
      };
    }

    return { success: false, error: "Unsupported XP tracking mode." };
  } catch {
    // No console.error or noisy logs
    return { success: false, error: "XP tracking failed." };
  }
};

export default trackXP;
