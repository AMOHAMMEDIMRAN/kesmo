const DEFAULT_TOKEN_LIMIT = 8000;
const CHARS_PER_TOKEN = 4;

export function estimateTokens(text: string): number {
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}

export function enforceTokenLimit(
  text: string,
  maxTokens: number = DEFAULT_TOKEN_LIMIT,
): string {
  const currentTokens = estimateTokens(text);

  if (currentTokens <= maxTokens) {
    return text;
  }

  const maxChars = maxTokens * CHARS_PER_TOKEN;
  const truncated = text.slice(0, maxChars);

  const lastNewline = truncated.lastIndexOf("\n");
  if (lastNewline > maxChars * 0.8) {
    return (
      truncated.slice(0, lastNewline) + "\n[... truncated for token limit]"
    );
  }

  return truncated + "\n[... truncated for token limit]";
}

export function getTokenStats(text: string): {
  chars: number;
  estimatedTokens: number;
} {
  return {
    chars: text.length,
    estimatedTokens: estimateTokens(text),
  };
}

export function splitByTokenLimit(
  text: string,
  maxTokens: number = DEFAULT_TOKEN_LIMIT,
): string[] {
  const chunks: string[] = [];
  const maxChars = maxTokens * CHARS_PER_TOKEN;

  let remaining = text;
  while (remaining.length > 0) {
    if (remaining.length <= maxChars) {
      chunks.push(remaining);
      break;
    }

    let splitPoint = maxChars;
    const searchArea = remaining.slice(0, maxChars);
    const lastNewline = searchArea.lastIndexOf("\n");
    if (lastNewline > maxChars * 0.7) {
      splitPoint = lastNewline;
    }

    chunks.push(remaining.slice(0, splitPoint));
    remaining = remaining.slice(splitPoint).trim();
  }

  return chunks;
}
