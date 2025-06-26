import { useEffect, useState, useCallback } from "react";
import { format, subDays } from "date-fns";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  collection,
  query,
  where,
  getDocs,
  Timestamp,
} from "firebase/firestore";
import { db } from "../firebase/firebaseClient"; // ✅ CORRECT PATH

const STREAK_KEY = "repz_user_streak";
const LAST_DATE_KEY = "repz_last_workout_date";

const getFormattedUTCDate = (date = new Date()) =>
  format(
    new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())),
    "yyyy-MM-dd",
  );

/**
 * Tracks user's workout streak and handles streak milestone logic.
 * @param {string} userId
 * @param {function} onMilestone - Callback when hitting 3, 7, or 14-day streak
 * @param {function} applyStreakBonus - Award XP if milestone reached
 */
const useStreakTracker = (userId, onMilestone, applyStreakBonus) => {
  const [streak, setStreak] = useState(0);
  const [isTodayLogged, setIsTodayLogged] = useState(false);

  const checkStreak = useCallback(async () => {
    try {
      const today = getFormattedUTCDate();
      const oneWeekAgo = subDays(new Date(), 7);

      const logsRef = collection(db, "logs");
      const q = query(
        logsRef,
        where("userId", "==", userId),
        where("date", ">=", Timestamp.fromDate(oneWeekAgo)),
      );

      const snapshot = await getDocs(q);
      const uniqueDates = [
        ...new Set(
          snapshot.docs
            .map((doc) => {
              const ts = doc.data()?.date;
              return ts?.seconds
                ? getFormattedUTCDate(new Date(ts.seconds * 1000))
                : null;
            })
            .filter(Boolean),
        ),
      ]
        .sort()
        .reverse();

      const todayLogged = uniqueDates.includes(today);
      setIsTodayLogged(todayLogged);

      let currentStreak = 0;
      for (let i = 0; i < uniqueDates.length; i++) {
        const expected = getFormattedUTCDate(subDays(new Date(), i));
        if (uniqueDates.includes(expected)) currentStreak++;
        else break;
      }

      const previousStreak = parseInt(
        (await AsyncStorage.getItem(STREAK_KEY)) || "0",
        10,
      );

      if (
        [3, 7, 14].includes(currentStreak) &&
        currentStreak !== previousStreak
      ) {
        if (typeof onMilestone === "function") onMilestone(currentStreak);
        if (typeof applyStreakBonus === "function") {
          await applyStreakBonus(currentStreak);
        }
      }

      await AsyncStorage.setItem(STREAK_KEY, currentStreak.toString());
      await AsyncStorage.setItem(LAST_DATE_KEY, today);
      setStreak(currentStreak);
    } catch (err) {
      try {
        const fallback = parseInt(
          (await AsyncStorage.getItem(STREAK_KEY)) || "0",
          10,
        );
        const lastDate = await AsyncStorage.getItem(LAST_DATE_KEY);
        const today = getFormattedUTCDate();

        setIsTodayLogged(lastDate === today);
        setStreak(lastDate === today ? fallback : 0);
      } catch {
        setIsTodayLogged(false);
        setStreak(0);
      }
    }
  }, [userId, onMilestone, applyStreakBonus]);

  useEffect(() => {
    if (userId) checkStreak();
  }, [userId, checkStreak]);

  const manuallyTriggerStreak = useCallback(async () => {
    const today = getFormattedUTCDate();
    await AsyncStorage.setItem(LAST_DATE_KEY, today);
    setIsTodayLogged(true);
  }, []);

  return {
    streak,
    isTodayLogged,
    manuallyTriggerStreak,
  };
};

export default useStreakTracker;
