import { loadConfig } from "../../utils/config.js";
import { runOpenAI } from "./openai.js";
import { runClaude } from "./claude.js";
import { runOpenRouter } from "./openrouter.js";
import { runGemini } from "./gemini.js";
import type { KesmoConfig } from "../../types.js";

export async function runLLM(prompt: string): Promise<string> {
  const config = loadConfig();

  try {
    switch (config.provider) {
      case "openai":
        return await runOpenAI(prompt, config);
      case "claude":
        return await runClaude(prompt, config);
      case "openrouter":
        return await runOpenRouter(prompt, config);
      case "google":
        return await runGemini(prompt, config);
      default:
        throw new Error(`Unknown provider: ${config.provider}`);
    }
  } catch (error) {
    if (error instanceof Error) {
      if (
        error.message.includes("401") ||
        error.message.includes("Unauthorized")
      ) {
        throw new Error(
          `Authentication failed for ${config.provider}. Please check your API key.`,
        );
      }
      if (
        error.message.includes("429") ||
        error.message.includes("rate limit")
      ) {
        throw new Error(
          `Rate limit exceeded for ${config.provider}. Please wait and try again.`,
        );
      }
      if (error.message.includes("model")) {
        throw new Error(
          `Invalid model "${config.model}" for ${config.provider}. Please check your configuration.`,
        );
      }
      throw error;
    }
    throw new Error(`Unknown error occurred while calling ${config.provider}`);
  }
}

export { runOpenAI, runClaude, runOpenRouter, runGemini };
export type { KesmoConfig };
