import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
} from "firebase/firestore";

import { db } from "../firebase/init.js";
import { verifyUser } from "../utils/authMiddleware.js";

const ALLOWED_TIERS = ["Free", "Pro", "Elite"];
const PAGE_SIZE = 20;

/**
 * Submit a lift to the leaderboard
 */
const submitLift = async (req, res) => {
  await verifyUser(req, res, async () => {
    const { exercise, weight, reps, gym, location, videoUrl, tier } = req.body;
    const userId = req.user?.uid;

    const isValid =
      userId &&
      typeof exercise === "string" &&
      exercise.trim() &&
      typeof weight === "number" &&
      weight > 0 &&
      typeof reps === "number" &&
      reps > 0 &&
      typeof gym === "string" &&
      gym.trim() &&
      typeof videoUrl === "string" &&
      videoUrl.trim() &&
      typeof tier === "string" &&
      ALLOWED_TIERS.includes(tier);

    if (!isValid) {
      return res.status(400).json({
        success: false,
        error: "Missing or invalid input fields.",
      });
    }

    const safeLocation =
      location &&
      typeof location.lat === "number" &&
      typeof location.lng === "number"
        ? location
        : null;

    try {
      const entry = {
        userId,
        exercise,
        weight,
        reps,
        gym,
        location: safeLocation,
        videoUrl,
        tier,
        createdAt: Timestamp.now(),
      };

      const docRef = await addDoc(collection(db, "leaderboard"), entry);

      return res.status(200).json({ success: true, entryId: docRef.id });
    } catch (err) {
      return res.status(500).json({
        success: false,
        error: "Failed to submit lift to leaderboard.",
      });
    }
  });
};

/**
 * Get top lifts based on exercise and optional scope (e.g., gym)
 * Supports pagination
 * Query params: ?exercise=Bench Press&scope=gym&gym=Gold's
 */
const getTopLifts = async (req, res) => {
  await verifyUser(req, res, async () => {
    const { exercise, scope, gym } = req.query;

    if (!exercise || typeof exercise !== "string" || !exercise.trim()) {
      return res.status(400).json({
        success: false,
        error: "Missing or invalid exercise parameter.",
      });
    }

    try {
      const lbRef = collection(db, "leaderboard");

      let baseQuery = query(
        lbRef,
        where("exercise", "==", exercise),
        orderBy("weight", "desc"),
        limit(PAGE_SIZE),
      );

      if (scope === "gym" && typeof gym === "string" && gym.trim()) {
        baseQuery = query(
          lbRef,
          where("exercise", "==", exercise),
          where("gym", "==", gym),
          orderBy("weight", "desc"),
          limit(PAGE_SIZE),
        );
      }

      const snapshot = await getDocs(baseQuery);
      const results = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      return res.status(200).json({ success: true, results });
    } catch (err) {
      return res.status(500).json({
        success: false,
        error: "Failed to fetch leaderboard data.",
      });
    }
  });
};

export { submitLift, getTopLifts };
