import axios from "axios";
import type { KesmoConfig } from "../../types.js";

interface OpenRouterResponse {
  choices: Array<{ message: { content: string } }>;
}

export async function runOpenRouter(
  prompt: string,
  config: KesmoConfig,
): Promise<string> {
  const res = await axios.post<OpenRouterResponse>(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      model: config.model,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 4096,
      temperature: 0.5,
    },
    {
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://github.com/kesmo-cli",
        "X-Title": "KESMO CLI",
      },
      timeout: 120000,
    },
  );

  const content = res.data.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No response received from OpenRouter");
  }

  return content;
}
