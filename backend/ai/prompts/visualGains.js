import dotenv from "dotenv";
dotenv.config();

import fetch from "node-fetch";

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

  const content = `
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
    const res = await fetch(
      `${process.env.EXPO_PUBLIC_API_BASE_URL}/api/openai`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [{ role: "user", content }],
        }),
      },
    );

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "AI call failed");

    return { success: true, summary: data.result };
  } catch (err) {
    return {
      success: false,
      error: {
        message: "Failed to analyze progress photos.",
        details: err.message || err,
        code: "PROMPT_FAILURE",
      },
    };
  }
};
