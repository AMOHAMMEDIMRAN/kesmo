export function normalizePromptWhitespace(prompt: string): string {
  return prompt
    .split("\n")
    .map((line) => line.trim())
    .filter((line, index, arr) => {
      if (line === "" && arr[index - 1] === "") return false;
      return true;
    })
    .join("\n")
    .trim();
}

export function removePromptRedundancy(prompt: string): string {
  const lines = prompt.split("\n");
  const seen = new Set<string>();
  const result: string[] = [];

  for (const line of lines) {
    const normalized = line.trim().toLowerCase();
    if (normalized.length > 50 && seen.has(normalized)) {
      continue;
    }
    seen.add(normalized);
    result.push(line);
  }

  return result.join("\n");
}

export function compressInstructions(prompt: string): string {
  return prompt
    .replace(/please\s+/gi, "")
    .replace(/could you\s+/gi, "")
    .replace(/I would like you to\s+/gi, "")
    .replace(/make sure to\s+/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function optimizePrompt(prompt: string): string {
  let optimized = normalizePromptWhitespace(prompt);
  optimized = removePromptRedundancy(optimized);
  return optimized;
}

export function buildFinalPrompt(
  agentPrompt: string,
  code: string,
  filePath: string,
): string {
  const header = `## Task\n${agentPrompt}\n\n`;
  const codeSection = `## Code (${filePath})\n\`\`\`\n${code}\n\`\`\``;

  return header + codeSection;
}
