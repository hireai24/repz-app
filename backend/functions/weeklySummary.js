import {
  collection,
  getDocs,
  query,
  where,
  Timestamp,
  addDoc,
} from "firebase/firestore";

import { db } from "../firebase/init.js";
import { calculateWorkoutXP } from "../../src/utils/xpCalculator.js";
import calculateStreak from "../utils/streakUtils.js";

/**
 * Generates a weekly workout summary for a user.
 * Includes XP, volume, streak info.
 */
const weeklySummary = async (userId) => {
  if (!userId || typeof userId !== "string") {
    return { success: false, error: "Invalid userId." };
  }

  try {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const logsRef = collection(db, "logs");
    const q = query(
      logsRef,
      where("userId", "==", userId),
      where("date", ">=", Timestamp.fromDate(oneWeekAgo)),
    );

    const snapshot = await getDocs(q);

    const logs = [];
    let totalVolume = 0;
    let totalXP = 0;
    let lastWorkoutDate = null;

    snapshot.forEach((docSnap) => {
      const log = docSnap.data();
      logs.push(log);

      const exercises = Array.isArray(log.exercises) ? log.exercises : [];

      const logVolume = exercises.reduce((sum, ex) => {
        const sets = Array.isArray(ex.sets) ? ex.sets : [];
        const exerciseVolume = sets.reduce((acc, s) => {
          return acc + (s.reps || 0) * (s.weight || 0);
        }, 0);
        return sum + exerciseVolume;
      }, 0);

      totalVolume += logVolume;
      totalXP += calculateWorkoutXP(log).total;

      const logDate =
        log.date?.seconds !== null ? new Date(log.date.seconds * 1000) : null;

      if (logDate && (!lastWorkoutDate || logDate > lastWorkoutDate)) {
        lastWorkoutDate = logDate;
      }
    });

    const { updatedStreak } = calculateStreak(lastWorkoutDate);

    const summary = {
      userId,
      weekOf: Timestamp.fromDate(new Date()),
      workoutsCompleted: logs.length,
      totalVolume,
      totalXP,
      updatedStreak,
      generatedAt: Timestamp.now(),
    };

    await addDoc(collection(db, "weeklySummaries"), summary);

    return { success: true, summary };
  } catch (err) {
    if (console?.error) {
      console.error("❌ Weekly summary generation failed:", err?.message);
    }
    return {
      success: false,
      error: err?.message || "Unknown error generating weekly summary.",
    };
  }
};

export default weeklySummary;
