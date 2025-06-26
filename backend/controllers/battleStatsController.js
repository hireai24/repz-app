import { db } from "../firebase/init.js";

/**
 * Fetches battle stats for a specific user.
 * Used in routes like /api/challenges/stats/:userId
 */
export const getBattleStats = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ success: false, error: "Missing userId." });
    }

    const ref = db.collection("battleStats").doc(userId);
    const snapshot = await ref.get();

    if (!snapshot.exists) {
      return res.status(200).json({
        success: true,
        stats: { wins: 0, losses: 0, currentStreak: 0, bestStreak: 0 },
      });
    }

    return res.status(200).json({ success: true, stats: snapshot.data() });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Error in getBattleStats:", err);
    return res
      .status(500)
      .json({ success: false, error: "Internal server error." });
  }
};

/**
 * Updates battle stats for a user after a challenge result.
 * Called after each challenge outcome.
 * This function should ONLY be called internally by other trusted backend functions.
 *
 * @param {string} userId - Firebase user ID
 * @param {boolean} won - Whether the user won the challenge
 */
export const updateBattleStats = async (userId, won) => {
  const ref = db.collection("battleStats").doc(userId);
  const snapshot = await ref.get();

  if (!snapshot.exists) {
    await ref.set({
      wins: won ? 1 : 0,
      losses: won ? 0 : 1,
      currentStreak: won ? 1 : 0,
      bestStreak: won ? 1 : 0,
    });
    return;
  }

  const data = snapshot.data();
  const newStreak = won ? (data.currentStreak || 0) + 1 : 0;
  const bestStreak = Math.max(data.bestStreak || 0, newStreak);

  await ref.update({
    wins: won ? (data.wins || 0) + 1 : data.wins || 0,
    losses: !won ? (data.losses || 0) + 1 : data.losses || 0,
    currentStreak: newStreak,
    bestStreak,
  });
};
