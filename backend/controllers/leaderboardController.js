import { db } from "../firebase/init.js";
import admin from "firebase-admin";

const ALLOWED_TIERS = ["Free", "Pro", "Elite"];
const PAGE_SIZE = 20;

/**
 * Submit a lift to the leaderboard
 * @param {object} data - { userId, exercise, weight, reps, gym, location, videoUrl, tier }
 * @returns {Promise<object>} - { success: boolean, entryId?: string, error?: string }
 */
const submitLift = async (data) => {
  const { exercise, weight, reps, gym, location, videoUrl, tier, userId } =
    data;

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
    return { success: false, error: "Missing or invalid input fields." };
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
      createdAt: new Date(), // Admin SDK uses JS Date object
    };

    const docRef = await db.collection("leaderboard").add(entry);

    return { success: true, entryId: docRef.id };
  } catch (err) {
    console.error("Error submitting lift:", err);
    return { success: false, error: "Failed to submit lift to leaderboard." };
  }
};

/**
 * Get top lifts based on exercise and optional scope (e.g., gym)
 * Supports pagination
 * @param {string} exercise - The exercise name (e.g., "Bench", "XP")
 * @param {string} scope - "global" or "gym"
 * @param {string} [gymId] - Required if scope is "gym"
 * @returns {Promise<object[]>} - Array of leaderboard entries
 */
const getTopLifts = async (exercise, scope, gymId = null) => {
  if (!exercise || typeof exercise !== "string" || !exercise.trim()) {
    throw new Error("Missing or invalid exercise parameter.");
  }

  try {
    let queryRef = db
      .collection("leaderboard")
      .where("exercise", "==", exercise)
      .orderBy("weight", "desc")
      .limit(PAGE_SIZE);

    if (scope === "gym" && typeof gymId === "string" && gymId.trim()) {
      queryRef = db
        .collection("leaderboard")
        .where("exercise", "==", exercise)
        .where("gym", "==", gymId)
        .orderBy("weight", "desc")
        .limit(PAGE_SIZE);
    }

    const snapshot = await queryRef.get();
    const results = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return results;
  } catch (err) {
    console.error("Error fetching top lifts:", err);
    throw new Error("Failed to fetch leaderboard data: " + err.message);
  }
};

/**
 * Get a user's rank for a specific exercise and scope.
 * @param {string} userId
 * @param {string} exercise
 * @param {string} scope - "global" or "gym"
 * @param {string} [gymId] - Required if scope is "gym"
 * @returns {Promise<object>} - { rank: number|null, bestLift: object|null, message?: string }
 */
const getUserRank = async (userId, exercise, scope, gymId = null) => {
  if (
    !userId ||
    !exercise ||
    typeof exercise !== "string" ||
    !exercise.trim()
  ) {
    throw new Error(
      "Missing or invalid userId or exercise parameter for user rank.",
    );
  }

  try {
    let queryRef = db
      .collection("leaderboard")
      .where("exercise", "==", exercise)
      .orderBy("weight", "desc");

    if (scope === "gym" && typeof gymId === "string" && gymId.trim()) {
      queryRef = queryRef.where("gym", "==", gymId);
    }

    const snapshot = await queryRef.get();
    const rankedLifts = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    const userEntryIndex = rankedLifts.findIndex(
      (entry) => entry.userId === userId,
    );
    const userRank = userEntryIndex !== -1 ? userEntryIndex + 1 : null;
    const userBestLift =
      userEntryIndex !== -1 ? rankedLifts[userEntryIndex] : null;

    if (userRank === null) {
      return {
        rank: null,
        bestLift: null,
        message: "User has no entry in this category/location.",
      };
    }

    return { rank: userRank, bestLift: userBestLift };
  } catch (err) {
    console.error("Error calculating user rank:", err);
    throw new Error("Failed to get user rank: " + err.message);
  }
};

export { submitLift, getTopLifts, getUserRank };
