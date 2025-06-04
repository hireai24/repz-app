// backend/utils/gymFeedUtils.js
// Placeholder for future enhancements like sanitizing or formatting post data
// FIX: Changed to ES Module export
export const validateFeedInput = ({ text }) => {
  if (text && text.length > 500) {
    throw new Error("Post text too long.");
  }
};