import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  Timestamp,
  runTransaction,
  doc,
} from "firebase/firestore";

import { db } from "../firebase/init.js";
import trackXP from "../functions/trackXP.js";
import { verifyUser } from "../utils/authMiddleware.js";

/**
 * Validate that exercises array is well-formed
 */
const isValidExerciseArray = (exercises) => {
  return (
    Array.isArray(exercises) &&
    exercises.every(
      (e) =>
        e.name &&
        typeof e.name === "string" &&
        typeof e.sets === "number" &&
        typeof e.reps === "number" &&
        typeof e.weight === "number",
    )
  );
};

/**
 * Save a workout log with ownership validation and XP tracking
 */
const saveWorkoutLog = async (req, res) => {
  await verifyUser(req, res, async (user) => {
    const { userId, date, exercises, challengeId, planId } = req.body;

    if (!userId || !date || !isValidExerciseArray(exercises)) {
      return res.status(400).json({
        success: false,
        error:
          "Missing or invalid input: userId, date, and valid exercises array required.",
      });
    }

    if (user.uid !== userId) {
      return res
        .status(403)
        .json({ success: false, error: "Unauthorized user." });
    }

    try {
      const logRef = doc(collection(db, "logs"));
      const logData = {
        userId,
        date: Timestamp.fromDate(new Date(date)),
        exercises,
        challengeId: challengeId || null,
        planId: planId || null,
        createdAt: new Date(),
      };

      await runTransaction(db, async (transaction) => {
        transaction.set(logRef, logData);
      });

      await trackXP(userId, logData);

      res.status(200).json({ success: true, logId: logRef.id });
    } catch {
      res
        .status(500)
        .json({ success: false, error: "Failed to save workout log." });
    }
  });
};

/**
 * Fetch all workout logs for a user (most recent first) with optional pagination
 */
const getUserWorkouts = async (req, res) => {
  await verifyUser(req, res, async (user) => {
    const { userId } = req.params;
    const { limit: limitQuery, startAfter: startAfterQuery } = req.query;

    if (!userId) {
      return res.status(400).json({ success: false, error: "Missing userId" });
    }

    if (user.uid !== userId) {
      return res
        .status(403)
        .json({ success: false, error: "Unauthorized user." });
    }

    try {
      const logsRef = collection(db, "logs");
      const constraints = [
        where("userId", "==", userId),
        orderBy("date", "desc"),
      ];

      const pageLimit = parseInt(limitQuery, 10) || 20;

      if (startAfterQuery) {
        const startAfterTimestamp = Timestamp.fromMillis(
          Number(startAfterQuery),
        );
        constraints.push(startAfter(startAfterTimestamp));
      }

      constraints.push(limit(pageLimit));

      const q = query(logsRef, ...constraints);
      const snapshot = await getDocs(q);

      const workouts = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      res.status(200).json({ success: true, workouts });
    } catch {
      res
        .status(500)
        .json({ success: false, error: "Failed to fetch workouts." });
    }
  });
};

export { saveWorkoutLog, getUserWorkouts };
