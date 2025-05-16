import { sendPrompt, cleanAIOutput } from "../../backend/utils/aiUtils.js";

/**
 * Analyzes visual progress photos using goal-specific AI logic.
 *
 * @param {Object} input
 * @param {string} input.weekStart - e.g. 'Week 1'
 * @param {string} input.weekEnd - e.g. 'Week 6'
 * @param {string} input.view - 'Front' | 'Side' | 'Back'
 * @param {string} input.userGoal - e.g. 'Fat Loss', 'Muscle Gain'
 * @returns {Object} AI-generated progress summary
 */
export const analyzeProgressPhotos = async ({
  weekStart,
  weekEnd,
  view,
  userGoal,
}) => {
  const isValid =
    typeof weekStart === "string" &&
    typeof weekEnd === "string" &&
    typeof view === "string" &&
    typeof userGoal === "string" &&
    weekStart.trim() &&
    weekEnd.trim() &&
    userGoal.trim() &&
    ["Front", "Side", "Back"].includes(view);

  if (!isValid) {
    return {
      success: false,
      error: {
        message: "Invalid input. Please ensure all fields are valid.",
        code: "INVALID_INPUT",
      },
    };
  }

  const prompt = `
You are a certified transformation coach AI trained to assess visual fitness progress.

=== USER CONTEXT ===
- Photo Range: ${weekStart} ➝ ${weekEnd}
- View: ${view}
- Goal: ${userGoal}

=== OBJECTIVE ===
Provide an expert, encouraging visual progress analysis based on the photos.

=== FORMAT ===
1. Muscle Definition: [Any visible changes in tone, definition, or size]
2. Fat Loss/Toning: [Fat reduction or contour changes]
3. Posture/Symmetry: [Notable postural shifts or alignment improvements]
4. Motivation: [Short uplifting comment — no fluff]

=== DISCLAIMER ===
This is an AI-generated summary for motivational use only. Do not use it as a substitute for certified coaching or medical evaluation.

Begin now:
`;

  try {
    const { success, result, error } = await sendPrompt(prompt);

    if (!success) {
      return {
        success: false,
        error: {
          message: "Failed to analyze progress photos.",
          details: error,
          code: "PROMPT_FAILURE",
        },
      };
    }

    return {
      success: true,
      summary: cleanAIOutput(result),
    };
  } catch (err) {
    return {
      success: false,
      error: {
        message: "Unexpected error during progress analysis.",
        details: err,
        code: "UNEXPECTED_ERROR",
      },
    };
  }
};
