import axios from "axios";
import type { KesmoConfig } from "../../types.js";

interface ClaudeResponse {
  content: Array<{ type: string; text: string }>;
}

export async function runClaude(
  prompt: string,
  config: KesmoConfig,
): Promise<string> {
  const res = await axios.post<ClaudeResponse>(
    "https://api.anthropic.com/v1/messages",
    {
      model: config.model,
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    },
    {
      headers: {
        "x-api-key": config.apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      timeout: 120000,
    },
  );

  const textContent = res.data.content.find((c) => c.type === "text");
  if (!textContent?.text) {
    throw new Error("No text response received from Claude");
  }

  return textContent.text;
}
