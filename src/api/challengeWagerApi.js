import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;
const CHALLENGE_URL = `${BASE_URL}/api/wager`; // ✅ FIXED

/**
 * Get stored JWT token for auth.
 */
const getAuthToken = async () => {
  const token = await AsyncStorage.getItem("authToken");
  return token || "";
};

/**
 * Create a new workout battle challenge.
 * @param {Object} data - Challenge config (exercise, xpPot, type, etc.)
 */
export const createChallenge = async (data) => {
  try {
    const token = await getAuthToken();
    const res = await fetch(`${CHALLENGE_URL}/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(errText || "Failed to create challenge.");
    }

    const result = await res.json();
    return { success: true, challenge: result.challenge };
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.error("createChallenge error:", err);
    }
    return { success: false, error: err.message };
  }
};

/**
 * Join an existing challenge.
 */
export const acceptChallenge = async (challengeId) => {
  try {
    const token = await getAuthToken();
    const res = await fetch(`${CHALLENGE_URL}/accept/${challengeId}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) throw new Error("Failed to accept challenge.");
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

/**
 * Submit video proof and notes for AI form evaluation.
 */
export const submitChallengeResult = async (challengeId, submission) => {
  try {
    const token = await getAuthToken();
    const res = await fetch(`${CHALLENGE_URL}/submit/${challengeId}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(submission),
    });

    if (!res.ok) throw new Error("Failed to submit result.");
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

/**
 * Resolve the challenge outcome using AI or admin.
 */
export const resolveChallengeOutcome = async (challengeId) => {
  try {
    const token = await getAuthToken();
    const res = await fetch(`${CHALLENGE_URL}/resolve/${challengeId}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) throw new Error("Failed to resolve challenge.");
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

/**
 * Submit a vote for who won the battle.
 * @param {string} challengeId
 * @param {string} votedUserId
 */
export const submitVote = async (challengeId, votedUserId) => {
  try {
    const token = await getAuthToken();
    const res = await fetch(`${CHALLENGE_URL}/vote/${challengeId}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ votedUserId }),
    });

    if (!res.ok) throw new Error("Failed to vote.");
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

/**
 * Get all vote results for a challenge.
 */
export const getVotes = async (challengeId) => {
  try {
    const token = await getAuthToken();
    const res = await fetch(`${CHALLENGE_URL}/votes/${challengeId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) throw new Error("Failed to fetch votes.");
    const result = await res.json();
    return { success: true, votes: result.votes };
  } catch (err) {
    return { success: false, error: err.message };
  }
};
