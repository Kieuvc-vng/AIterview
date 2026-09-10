import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function callClaude(
  systemPrompt: string,
  userMessage: string,
  maxRetries = 1
): Promise<string> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const message = await client.messages.create({
        model: "claude-sonnet-5",
        max_tokens: 2048,
        system: systemPrompt,
        messages: [{ role: "user", content: userMessage }],
      });

      const block = message.content[0];
      if (block.type === "text") {
        return block.text;
      }
      throw new Error("Unexpected response format");
    } catch (error) {
      if (attempt === maxRetries) throw error;
    }
  }
  throw new Error("Max retries exceeded");
}
