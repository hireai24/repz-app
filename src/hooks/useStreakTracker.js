import { useEffect, useState } from "react";
import { format, subDays } from "date-fns";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  collection,
  query,
  where,
  getDocs,
  Timestamp,
} from "firebase/firestore";

import { db } from "../../backend/firebase/init";

const STREAK_KEY = "repz_user_streak";
const LAST_DATE_KEY = "repz_last_workout_date";

const getFormattedUTCDate = (date = new Date()) =>
  format(
    new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())),
    "yyyy-MM-dd",
  );

const useStreakTracker = (userId) => {
  const [streak, setStreak] = useState(0);
  const [isTodayLogged, setIsTodayLogged] = useState(false);

  useEffect(() => {
    if (userId) {
      checkStreak(userId);
    }
  }, [userId]);

  const checkStreak = async (uid) => {
    try {
      const today = getFormattedUTCDate();
      const oneWeekAgo = subDays(new Date(), 7);

      const logsRef = collection(db, "logs");
      const q = query(
        logsRef,
        where("userId", "==", uid),
        where("date", ">=", Timestamp.fromDate(oneWeekAgo)),
      );

      const snapshot = await getDocs(q);

      const dates = snapshot.docs
        .map((doc) => {
          const data = doc.data();
          const ts = data?.date;
          return ts?.seconds
            ? getFormattedUTCDate(new Date(ts.seconds * 1000))
            : null;
        })
        .filter(Boolean);

      const uniqueDates = [...new Set(dates)].sort().reverse();

      if (uniqueDates.includes(today)) {
        setIsTodayLogged(true);
      } else {
        setIsTodayLogged(false);
      }

      let currentStreak = 0;

      for (let i = 0; i < uniqueDates.length; i++) {
        const expected = getFormattedUTCDate(subDays(new Date(), i));
        if (uniqueDates.includes(expected)) {
          currentStreak++;
        } else {
          break;
        }
      }

      await AsyncStorage.setItem(STREAK_KEY, currentStreak.toString());
      await AsyncStorage.setItem(LAST_DATE_KEY, today);
      setStreak(currentStreak);
    } catch (err) {
      console.error(
        "Firestore streak fetch failed. Falling back to local.",
        err,
      );

      try {
        const savedStreak = parseInt(
          (await AsyncStorage.getItem(STREAK_KEY)) || "0",
          10,
        );
        const lastDate = await AsyncStorage.getItem(LAST_DATE_KEY);
        const today = getFormattedUTCDate();

        if (lastDate === today) {
          setIsTodayLogged(true);
          setStreak(savedStreak);
        } else {
          setIsTodayLogged(false);
          setStreak(0);
        }
      } catch (storageErr) {
        console.error("Fallback streak storage read failed:", storageErr);
        setIsTodayLogged(false);
        setStreak(0);
      }
    }
  };

  const manuallyTriggerStreak = async () => {
    try {
      const today = getFormattedUTCDate();
      await AsyncStorage.setItem(LAST_DATE_KEY, today);
      setIsTodayLogged(true);
    } catch (err) {
      console.error("Manual streak update failed:", err);
    }
  };

  return {
    streak,
    isTodayLogged,
    manuallyTriggerStreak,
  };
};

export default useStreakTracker;
