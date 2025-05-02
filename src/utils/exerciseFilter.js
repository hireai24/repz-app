/**
 * Filters a list of exercises based on multiple criteria.
 *
 * @param {Array} exercises - The full list of exercises
 * @param {Object} filters - Filtering options: category, muscle, equipment, level
 * @returns {Array} - Filtered exercises
 */
export const filterExercises = (exercises, filters = {}) => {
  if (!Array.isArray(exercises)) {
    console.warn('filterExercises: exercises must be an array');
    return [];
  }

  const allowedKeys = ['category', 'muscle', 'equipment', 'level'];
  Object.keys(filters).forEach((key) => {
    if (!allowedKeys.includes(key)) {
      console.warn(`filterExercises: unsupported filter key "${key}"`);
    }
  });

  return exercises.filter((ex) => {
    const name = (ex.name || '').toLowerCase();
    const category = (ex.category || '').toLowerCase();
    const muscle = (ex.muscle || '').toLowerCase();
    const equipment = (ex.equipment || '').toLowerCase();
    const level = (ex.level || '').toLowerCase();

    const matchCategory =
      !filters.category || category === filters.category.toLowerCase().trim();

    const matchMuscle =
      !filters.muscle || muscle.includes(filters.muscle.toLowerCase().trim());

    const matchEquipment =
      !filters.equipment || equipment.includes(filters.equipment.toLowerCase().trim());

    const matchLevel =
      !filters.level || level === filters.level.toLowerCase().trim();

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
export const searchExercises = (exercises, query = '') => {
  if (!Array.isArray(exercises)) {
    console.warn('searchExercises: exercises must be an array');
    return [];
  }

  const term = (query || '').trim().toLowerCase();
  return exercises.filter((ex) =>
    (ex.name || '').toLowerCase().includes(term)
  );
};
