import { format, formatDistanceToNow, parseISO, isValid } from 'date-fns';
import { enUS } from 'date-fns/locale'; // default locale (can be dynamic later)

/**
 * Format a date string as "Jan 1, 2025"
 * @param {string} isoString
 * @returns {string}
 */
export const formatDate = (isoString) => {
  try {
    if (!isoString) return '';
    const parsed = parseISO(isoString);
    if (!isValid(parsed)) return '';
    return format(parsed, 'MMM d, yyyy', { locale: enUS });
  } catch {
    return '';
  }
};

/**
 * Format date + time as "Jan 1 • 4:00 PM"
 * @param {string} isoString
 * @returns {string}
 */
export const formatDateTime = (isoString) => {
  try {
    if (!isoString) return '';
    const parsed = parseISO(isoString);
    if (!isValid(parsed)) return '';
    return format(parsed, 'MMM d • h:mm a', { locale: enUS });
  } catch {
    return '';
  }
};

/**
 * Return relative time like "2 days ago"
 * @param {string} isoString
 * @returns {string}
 */
export const timeAgo = (isoString) => {
  try {
    if (!isoString) return '';
    const parsed = parseISO(isoString);
    if (!isValid(parsed)) return '';
    return formatDistanceToNow(parsed, { addSuffix: true, locale: enUS });
  } catch {
    return '';
  }
};
