import { Configuration, OpenAIApi } from 'openai';

// === Validate Config Early ===
const openAiApiKey = process.env.OPENAI_API_KEY;
if (!openAiApiKey) {
  throw new Error('❌ Missing OPENAI_API_KEY environment variable.');
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
export const sendPrompt = async (prompt, model = 'gpt-3.5-turbo') => {
  const maxRetries = 3;
  let retryDelay = 1000; // 1 second between retries

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      console.log(`Attempting OpenAI request - Try #${attempt + 1}`);
      const response = await openai.createChatCompletion({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
      });

      const message = response?.data?.choices?.[0]?.message?.content || '';
      aiUsageCounter++;

      // Clean AI response before returning
      const cleanedResponse = cleanAIOutput(message);
      return { success: true, result: cleanedResponse };
    } catch (err) {
      const isLastAttempt = attempt === maxRetries - 1;
      console.error(`❌ OpenAI error (attempt ${attempt + 1}):`, err?.response?.data || err?.message);

      if (isLastAttempt) {
        return {
          success: false,
          error: err?.response?.data?.error?.message || err?.message || 'Unknown AI error occurred',
          fallback: 'Unfortunately, AI could not generate a response at this time.',
        };
      }

      // Implement exponential backoff for retry delays
      retryDelay *= 2;  // Exponentially increase the delay
      console.log(`⏳ Retrying in ${retryDelay / 1000} seconds...`);
      await wait(retryDelay); // wait before next retry
    }
  }
};

// === Clean Up AI Output Text ===
export const cleanAIOutput = (text) => {
  // Trim unnecessary spaces, new lines, carriage returns, and tabs.
  return text
    .replace(/^\s+|\s+$/g, '')  // Trim spaces
    .replace(/\\n/g, '\n')       // Correct escaped newline characters
    .replace(/\r/g, '')          // Remove carriage returns
    .replace(/\t/g, '')          // Remove tabs
    .replace(/<\/?[^>]+(>|$)/g, ""); // Clean out HTML tags if any
};

// === Optionally export the AI usage counter ===
export const getAIUsageCount = () => aiUsageCounter;

