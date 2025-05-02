import { sendPrompt, cleanAIOutput } from '../../backend/utils/aiUtils.js';

/**
 * Evaluates exercise form based on rep-by-rep video transcript.
 * Produces expert PT-level feedback, tailored and precise.
 *
 * @param {Object} input
 * @param {string} input.exercise - Name of the exercise (e.g., 'Back Squat')
 * @param {number} input.reps - Number of reps performed
 * @param {string} input.transcript - Rep-by-rep breakdown text
 * @returns {Object} AI feedback response
 */
export const evaluateFormFromTranscript = async ({ exercise, reps, transcript }) => {
  if (
    typeof exercise !== 'string' ||
    typeof reps !== 'number' ||
    typeof transcript !== 'string' ||
    !exercise.trim() ||
    !transcript.trim()
  ) {
    return {
      success: false,
      error: {
        message: 'Invalid input. Exercise, reps, and transcript are required.',
        code: 'INVALID_INPUT',
      },
    };
  }

  const prompt = `
You are an elite-level Certified Strength & Conditioning Specialist (CSCS) AI, specializing in biomechanics and advanced form analysis.

Task: Evaluate the user's form across multiple reps of the exercise provided.

=== CONTEXT ===
Exercise: ${exercise}
Reps Performed: ${reps}

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

Rep 2:
- Score: 8/10
- Strengths: Smooth tempo, stable spine
- Corrections: Improve foot pressure balance
- Urgency Level: Low

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

=== END ===
`;

  try {
    const { success, result, error } = await sendPrompt(prompt);

    if (!success) {
      return {
        success: false,
        error: {
          message: 'AI prompt failed',
          details: error,
          code: 'PROMPT_FAILURE',
        },
      };
    }

    return {
      success: true,
      feedback: cleanAIOutput(result),
    };
  } catch (err) {
    console.error('🔥 Form evaluation error:', err);
    return {
      success: false,
      error: {
        message: 'Unexpected error during AI evaluation.',
        details: err,
        code: 'UNEXPECTED_ERROR',
      },
    };
  }
};
