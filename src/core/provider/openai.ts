import OpenAI from "openai";
import type { KesmoConfig } from "../../types.js";

export async function runOpenAI(
  prompt: string,
  config: KesmoConfig,
): Promise<string> {
  const client = new OpenAI({ apiKey: config.apiKey });

  const res = await client.chat.completions.create({
    model: config.model,
    messages: [{ role: "user", content: prompt }],
    max_tokens: 4096,
    temperature: 0.5,
  });

  const content = res.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No response received from OpenAI");
  }

  return content;
}
