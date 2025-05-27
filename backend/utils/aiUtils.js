import { Configuration, OpenAIApi } from "openai";

// === Validate Config Early ===
const openAiApiKey = process.env.OPENAI_API_KEY;
if (!openAiApiKey) {
  throw new Error("❌ Missing OPENAI_API_KEY environment variable.");
}

// === Initialize OpenAI API ===
const configuration = new Configuration({
  apiKey: openAiApiKey,
});
const openai = new OpenAIApi(configuration);

// === Usage Metrics (Optional) ===
let aiUsageCounter = 0;

// === Delay Helper ===
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// === Send Prompt to OpenAI with Retry and Fallback ===
export const sendPrompt = async (prompt, model = "gpt-3.5-turbo") => {
  const maxRetries = 3;
  let retryDelay = 1000; // 1 second

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await openai.createChatCompletion({
        model,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
      });

      const message = response?.data?.choices?.[0]?.message?.content || "";
      aiUsageCounter++;

      const cleanedResponse = cleanAIOutput(message);
      return { success: true, result: cleanedResponse };
    } catch (err) {
      const isLast = attempt === maxRetries - 1;

      if (isLast) {
        return {
          success: false,
          error:
            err?.response?.data?.error?.message ||
            err?.message ||
            "Unknown AI error occurred.",
          fallback: "AI failed to generate a response at this time.",
        };
      }

      retryDelay *= 2;
      await wait(retryDelay);
    }
  }
};

// === Clean Up AI Output Text ===
export const cleanAIOutput = (text) => {
  return text
    .replace(/^\s+|\s+$/g, "")
    .replace(/\\n/g, "\n")
    .replace(/\r/g, "")
    .replace(/\t/g, "")
    .replace(/<\/?[^>]+(>|$)/g, "")
    .replace(/\s{2,}/g, " ") // Remove excessive spaces
    .trim();
};

// === Optionally export the AI usage counter ===
export const getAIUsageCount = () => aiUsageCounter;
