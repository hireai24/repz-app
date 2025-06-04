import dotenv from "dotenv";
dotenv.config();

// import fetch from "node-fetch"; // REMOVED: No longer direct fetch
import { getOpenAIResponse } from "../../utils/openaiHelper.js"; // ADDED: Import openaiHelper

/**
 * Evaluates exercise form based on rep-by-rep video transcript.
 * Returns structured, PT-level feedback.
 */
export const evaluateFormFromTranscript = async ({
  exercise,
  reps,
  transcript,
  gymContext = null,
  token = null // ADDED: Accept token for authenticated AI call
}) => {
  if (
    typeof exercise !== "string" ||
    typeof reps !== "number" ||
    typeof transcript !== "string" ||
    !exercise.trim() ||
    !transcript.trim()
  ) {
    return {
      success: false,
      error: {
        message: "Invalid input. Exercise, reps, and transcript are required.",
        code: "INVALID_INPUT",
      },
    };
  }

  const contextNote = gymContext
    ? `\n\nGym Context:\nThis session took place at: ${gymContext}\nThis may affect lighting, environment, or equipment availability. Adjust feedback if relevant.\n`
    : "";

  const prompt = `
You are an elite-level Certified Strength & Conditioning Specialist (CSCS) AI, specializing in biomechanics and advanced form analysis.

Task: Evaluate the user's form across multiple reps of the exercise provided.

=== CONTEXT ===
Exercise: ${exercise}
Reps Performed: ${reps}
${contextNote}

Rep-by-Rep Transcript (observations):
${transcript}

=== YOUR OUTPUT ===
For EACH rep:
- **Score:** 1 to 10
- **Strengths:** List good points briefly
- **Corrections:** List needed improvements briefly
- **Urgency Level:** (Low, Medium, High) — based on injury risk or critical flaws

After all reps:
- **Overall Score:** (average score)
- **Summary of Key Strengths:** (1–2 points)
- **Top 3 Prioritized Corrections:** (most important form fixes)
- **Expert Cues:** 3 extremely concise and actionable cues

=== RULES ===
- Be brutally honest but constructive.
- Use clear professional language — no casual phrases.
- Never guess if unsure — say "Insufficient data for this rep."
- Short sentences — clinical and efficient.
- No introductions, disclaimers, or apologies.
- Follow EXACTLY the output format below.

=== OUTPUT FORMAT ===

Rep 1:
- Score: 7/10
- Strengths: Good depth, strong core engagement
- Corrections: Minor knee valgus on ascent
- Urgency Level: Medium

...

Overall Score: 7.5/10

Summary of Key Strengths:
- Consistent depth
- Good bar control

Top 3 Prioritized Corrections:
1. Maintain outward knee pressure during ascent
2. Slow eccentric phase by 1 second
3. Increase glute engagement at lockout

Expert Cues:
- "Screw feet into ground"
- "Brace and hold breath during descent"
- "Push knees out through entire lift"
`;

  try {
    const messages = [{ role: "user", content: prompt }];
    const feedback = await getOpenAIResponse(messages, token); // CHANGED: Use openaiHelper with token

    return { success: true, feedback };
  } catch (err) {
    console.error("Error in evaluateFormFromTranscript:", err); // Server-side debugging
    return {
      success: false,
      error: {
        message: "AI request failed.",
        details: err.message || err,
        code: "PROMPT_FAILURE",
      },
    };
  }
};