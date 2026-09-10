import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.QWEN_API_KEY,
  baseURL: process.env.QWEN_BASE_URL || "https://dashscope.aliyuncs.com/compatible-mode/v1",
});

const PRIMARY_MODEL = process.env.QWEN_MODEL_PRIMARY || "qwen-plus-2025-04-28";
const BACKUP_MODEL = process.env.QWEN_MODEL_BACKUP || "qwen-turbo-2025-04-28";

async function callModel(
  model: string,
  systemPrompt: string,
  userMessage: string
): Promise<string> {
  const response = await client.chat.completions.create({
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
    max_tokens: 4096,
    temperature: 0.3,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("Empty response from model");
  return content;
}

export function safeParseJSON<T>(text: string): T {
  const cleaned = text.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();
  return JSON.parse(cleaned);
}

export async function callQwen(
  systemPrompt: string,
  userMessage: string,
  options?: { useBackup?: boolean }
): Promise<string> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      return await callModel(PRIMARY_MODEL, systemPrompt, userMessage);
    } catch (error) {
      if (attempt === 1) {
        if (options?.useBackup) {
          console.warn(`Primary model failed after retry, switching to backup: ${BACKUP_MODEL}`);
          return await callModel(BACKUP_MODEL, systemPrompt, userMessage);
        }
        throw error;
      }
    }
  }
  throw new Error("Unreachable");
}
