// src/utils/challengeGenerators.js

import { Timestamp } from "firebase/firestore";

/**
 * Generates a basic push-up challenge.
 * Personalized by XP amount and creator.
 * @param {string} userId - Firebase UID of the user
 * @returns {Object} - Push-up challenge object
 */
export const generatePushupsChallenge = (userId) => {
  const reps = 30 + Math.floor(Math.random() * 21); // 30–50 reps
  const xp = reps * 2;

  return {
    id: `daily-pushups-${Date.now()}`,
    title: `Do ${reps} push-ups today`,
    type: "reps",
    exercise: "Push-ups",
    targetReps: reps,
    xpReward: xp,
    createdBy: "system",
    assignedTo: userId,
    createdAt: Timestamp.now(),
    dueDate: Timestamp.fromDate(new Date(Date.now() + 86400000)), // 24 hrs
    completed: false,
    verified: false,
  };
};

/**
 * Generates a total volume lifting challenge (weight x reps).
 * @param {string} userId - Firebase UID of the user
 * @returns {Object} - Volume challenge object
 */
export const generateVolumeChallenge = (userId) => {
  const volumeTarget = 2000 + Math.floor(Math.random() * 3001); // 2000–5000kg
  const xp = Math.floor(volumeTarget / 20); // ~100–250 XP

  return {
    id: `daily-volume-${Date.now()}`,
    title: `Lift ${volumeTarget} kg total today`,
    type: "volume",
    targetVolume: volumeTarget,
    xpReward: xp,
    exercise: "Any",
    createdBy: "system",
    assignedTo: userId,
    createdAt: Timestamp.now(),
    dueDate: Timestamp.fromDate(new Date(Date.now() + 86400000)), // 24 hrs
    completed: false,
    verified: false,
  };
};
