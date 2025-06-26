import { startOfDay, differenceInDays, parseISO, isValid } from "date-fns";

/**
 * Calculates the new workout streak and whether today counts as a new workout day.
 * - If today = last workout day, streak doesn't increment, not a new day.
 * - If yesterday = last workout day, streak increments, is a new day.
 * - If gap > 1 day, streak resets to 1, is a new day.
 *
 * @param {string|null} lastWorkoutDateStr - ISO string of last workout date
 * @param {number} [currentStreak=0] - Existing streak value (optional)
 * @returns {Object} - { updatedStreak, isNewDay }
 */
const calculateStreak = (lastWorkoutDateStr = null, currentStreak = 0) => {
  const today = startOfDay(new Date());

  if (!lastWorkoutDateStr || typeof lastWorkoutDateStr !== "string") {
    return {
      updatedStreak: 1,
      isNewDay: true,
    };
  }

  const lastWorkoutDate = parseISO(lastWorkoutDateStr);

  if (!isValid(lastWorkoutDate)) {
    return {
      updatedStreak: 1,
      isNewDay: true,
    };
  }

  const last = startOfDay(lastWorkoutDate);
  const diffInDays = differenceInDays(today, last);

  if (diffInDays === 0) {
    // Already logged today – do not increment streak
    return {
      updatedStreak: currentStreak,
      isNewDay: false,
    };
  }
  if (diffInDays === 1) {
    // Consecutive day – increment streak
    return {
      updatedStreak: currentStreak + 1,
      isNewDay: true,
    };
  }
  // Missed days – reset streak to 1
  return {
    updatedStreak: 1,
    isNewDay: true,
  };
};

export default calculateStreak;
