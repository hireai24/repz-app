import { startOfDay, differenceInDays, parseISO, isValid } from "date-fns";

/**
 * Calculates workout streaks based on the last workout date.
 * - Returns updated streak count and whether today is a new workout day.
 * - Used to trigger XP bonuses, badge streaks, and motivational messaging.
 *
 * @param {string|null} lastWorkoutDateStr - ISO string of last workout date
 * @returns {Object} - { updatedStreak, isNewDay }
 */
const calculateStreak = (lastWorkoutDateStr = null) => {
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
    return {
      updatedStreak: 0,
      isNewDay: false,
    };
  }

  if (diffInDays === 1) {
    return {
      updatedStreak: 1,
      isNewDay: true,
    };
  }

  return {
    updatedStreak: 1,
    isNewDay: true,
  };
};

export default calculateStreak;
