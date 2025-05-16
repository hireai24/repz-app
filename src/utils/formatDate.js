import { format, formatDistanceToNow, parseISO, isValid } from "date-fns";
import { enUS } from "date-fns/locale"; // Default locale

// TODO: In future, replace this with dynamic locale selection based on user settings
const locale = enUS;

/**
 * Format a date string like "Jan 1, 2025"
 * @param {string} isoString
 * @returns {string}
 */
export const formatDate = (isoString) => {
  try {
    if (typeof isoString !== "string") return "";
    const parsed = parseISO(isoString);
    if (!isValid(parsed)) return "";
    return format(parsed, "MMM d, yyyy", { locale });
  } catch (err) {
    console.warn("formatDate error:", err);
    return "";
  }
};

/**
 * Format a full datetime like "Jan 1 • 4:00 PM"
 * @param {string} isoString
 * @returns {string}
 */
export const formatDateTime = (isoString) => {
  try {
    if (typeof isoString !== "string") return "";
    const parsed = parseISO(isoString);
    if (!isValid(parsed)) return "";
    return format(parsed, "MMM d • h:mm a", { locale });
  } catch (err) {
    console.warn("formatDateTime error:", err);
    return "";
  }
};

/**
 * Show relative time like "2 days ago"
 * @param {string} isoString
 * @returns {string}
 */
export const timeAgo = (isoString) => {
  try {
    if (typeof isoString !== "string") return "";
    const parsed = parseISO(isoString);
    if (!isValid(parsed)) return "";
    return formatDistanceToNow(parsed, { addSuffix: true, locale });
  } catch (err) {
    console.warn("timeAgo error:", err);
    return "";
  }
};
