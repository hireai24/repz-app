// backend/utils/challengeGenerators.js

import { Timestamp } from "firebase/firestore";

/**
 * Generates a push-up challenge.
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
 * Generates a lifting volume challenge.
 * @param {string} userId
 * @returns {Object}
 */
export const generateVolumeChallenge = (userId) => {
  const targetVolume = 10000 + Math.floor(Math.random() * 5000); // 10K–15K kg
  return {
    id: `daily-volume-${Date.now()}`,
    title: `Lift a total of ${targetVolume} kg today`,
    type: "volume",
    exercise: "Any",
    targetVolume,
    xpReward: Math.floor(targetVolume / 20),
    createdBy: "system",
    assignedTo: userId,
    createdAt: Timestamp.now(),
    dueDate: Timestamp.fromDate(new Date(Date.now() + 86400000)),
    completed: false,
    verified: false,
  };
};
