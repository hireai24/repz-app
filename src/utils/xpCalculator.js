/**
 * Calculates XP based on workout performance.
 *
 * @param {Object} input
 * @param {number} input.volume - Total training volume (weight × sets × reps)
 * @param {number} input.prCount - Number of personal records hit
 * @param {number} input.streak - Current workout streak
 * @param {boolean} input.challenge - Whether this workout was part of a challenge
 * @returns {Object} { total, breakdown: { baseXP, prBonus, streakBonus, challengeBoost } }
 */
export const calculateWorkoutXP = (input = {}) => {
  const {
    volume = 0,
    prCount = 0,
    streak = 0,
    challenge = false,
  } = input;

  // Validate and sanitize inputs
  const safeVolume = Number.isFinite(volume) ? Math.max(0, volume) : 0;
  const safePRs = Number.isInteger(prCount) && prCount >= 0 ? prCount : 0;
  const safeStreak = Number.isInteger(streak) && streak >= 0 ? streak : 0;
  const isChallenge = typeof challenge === "boolean" ? challenge : false;

  // XP formula
  const baseXP = Math.floor(safeVolume / 200); // 1 XP per 200kg of volume
  const prBonus = safePRs * 10;                // 10 XP per PR
  const streakBonus = safeStreak > 5 ? 15 : safeStreak * 2; // Max 15 XP for streak
  const challengeBoost = isChallenge ? 25 : 0; // 25 XP for challenge workout

  const totalXP = baseXP + prBonus + streakBonus + challengeBoost;

  return {
    total: totalXP,
    breakdown: {
      baseXP,
      prBonus,
      streakBonus,
      challengeBoost,
    },
  };
};
