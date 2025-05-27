/**
 * Filters a list of exercises based on multiple criteria.
 *
 * @param {Array} exercises - The full list of exercises
 * @param {Object} filters - Filtering options: category, muscle, equipment, level
 * @returns {Array} - Filtered exercises
 */
export const filterExercises = (exercises, filters = {}) => {
  if (!Array.isArray(exercises)) {
    // eslint-disable-next-line no-console
    console.warn("filterExercises: exercises must be an array");
    return [];
  }

  const allowedKeys = ["category", "muscle", "equipment", "level"];
  for (const key of Object.keys(filters)) {
    if (!allowedKeys.includes(key)) {
      // eslint-disable-next-line no-console
      console.warn(`filterExercises: unsupported filter key "${key}"`);
    }
  }

  const normalizedFilters = {
    category: filters.category?.toLowerCase().trim() || "",
    muscle: filters.muscle?.toLowerCase().trim() || "",
    equipment: filters.equipment?.toLowerCase().trim() || "",
    level: filters.level?.toLowerCase().trim() || "",
  };

  return exercises.filter((ex) => {
    const category = String(ex.category || "").toLowerCase();
    const muscle = String(ex.muscle || "").toLowerCase();
    const equipment = String(ex.equipment || "").toLowerCase();
    const level = String(ex.level || "").toLowerCase();

    const matchCategory =
      !normalizedFilters.category || category === normalizedFilters.category;
    const matchMuscle =
      !normalizedFilters.muscle || muscle.includes(normalizedFilters.muscle);
    const matchEquipment =
      !normalizedFilters.equipment ||
      equipment.includes(normalizedFilters.equipment);
    const matchLevel =
      !normalizedFilters.level || level === normalizedFilters.level;

    return matchCategory && matchMuscle && matchEquipment && matchLevel;
  });
};

/**
 * Searches exercises by name using a query string.
 *
 * @param {Array} exercises - The list of exercises
 * @param {string} query - Search keyword
 * @returns {Array} - Matched exercises
 */
export const searchExercises = (exercises, query = "") => {
  if (!Array.isArray(exercises)) {
    // eslint-disable-next-line no-console
    console.warn("searchExercises: exercises must be an array");
    return [];
  }

  const term = query.trim().toLowerCase();
  if (!term) return exercises;

  return exercises.filter((ex) => (ex.name || "").toLowerCase().includes(term));
};

/**
 * Creates a debounced version of a function for performance on large datasets.
 *
 * @param {Function} func - The function to debounce
 * @param {number} delay - Delay in ms
 * @returns {Function} - Debounced function
 */
export const debounce = (func, delay = 300) => {
  let timeout;
  return (...args) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), delay);
  };
};
