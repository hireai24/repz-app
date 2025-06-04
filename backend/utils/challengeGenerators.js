// backend/utils/challengeGenerators.js

import { Timestamp } from "firebase/firestore";

/**
 * Generates a push-up challenge.
 * @param {string} userId - Firebase UID of the user this challenge is assigned to.
 * @param {Object} options - Configuration options for the challenge.
 * @param {number} [options.reps] - Desired number of repetitions.
 * @returns {Object} - Push-up challenge object
 */
export const generatePushupsChallenge = (userId, options = {}) => {
  const reps = options.reps || (30 + Math.floor(Math.random() * 21)); // 30–50 reps or specified
  const xp = reps * 2;

  return {
    id: `daily-pushups-${Date.now()}-${userId}`, // Make ID more unique
    title: `Do ${reps} push-ups today`,
    type: "reps",
    exercise: "Push-ups",
    targetReps: reps,
    xpReward: xp,
    createdBy: "system",
    assignedTo: userId, // Ensure userId is used
    createdAt: Timestamp.now(),
    dueDate: Timestamp.fromDate(new Date(Date.now() + 86400000)), // 24 hrs
    completed: false,
    verified: false,
  };
};

/**
 * Generates a lifting volume challenge.
 * @param {string} userId - Firebase UID of the user this challenge is assigned to.
 * @param {Object} options - Configuration options for the challenge.
 * @param {number} [options.minVolume] - Minimum target volume.
 * @returns {Object}
 */
export const generateVolumeChallenge = (userId, options = {}) => {
  const minVolume = options.minVolume || 10000;
  const targetVolume = minVolume + Math.floor(Math.random() * 5000); // 10K–15K kg or based on minVolume
  const xp = Math.floor(targetVolume / 20);

  return {
    id: `daily-volume-${Date.now()}-${userId}`, // Make ID more unique
    title: `Lift a total of ${targetVolume} kg today`,
    type: "volume",
    exercise: "Any",
    targetVolume,
    xpReward: xp,
    createdBy: "system",
    assignedTo: userId, // Ensure userId is used
    createdAt: Timestamp.now(),
    dueDate: Timestamp.fromDate(new Date(Date.now() + 86400000)), // 24 hrs
    completed: false,
    verified: false,
  };
};