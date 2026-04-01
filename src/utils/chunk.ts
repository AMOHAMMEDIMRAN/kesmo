const DEFAULT_CHUNK_SIZE = 2000;
const STRUCTURE_BOUNDARIES = [
  /\n(?=(?:export\s+)?(?:class|interface|type|function|const|let|var|async\s+function)\s)/g,
  /\n(?=(?:def|class|async\s+def)\s)/g,
  /\n(?=(?:public|private|protected|func|fn)\s)/g,
  /\n\n/g,
  /\n/g,
];

export function chunk(
  text: string,
  maxSize: number = DEFAULT_CHUNK_SIZE,
): string[] {
  if (text.length <= maxSize) {
    return [text];
  }

  const chunks: string[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    if (remaining.length <= maxSize) {
      chunks.push(remaining);
      break;
    }

    let splitPoint = findBestSplitPoint(remaining, maxSize);
    chunks.push(remaining.slice(0, splitPoint).trim());
    remaining = remaining.slice(splitPoint).trim();
  }

  return chunks.filter((c) => c.length > 0);
}

function findBestSplitPoint(text: string, maxSize: number): number {
  const searchArea = text.slice(0, maxSize);

  for (const boundary of STRUCTURE_BOUNDARIES) {
    const matches = [...searchArea.matchAll(boundary)];
    if (matches.length > 0) {
      const lastMatch = matches[matches.length - 1];
      if (lastMatch?.index && lastMatch.index > maxSize * 0.5) {
        return lastMatch.index;
      }
    }
  }

  const lastNewline = searchArea.lastIndexOf("\n");
  if (lastNewline > maxSize * 0.5) {
    return lastNewline;
  }

  const lastSpace = searchArea.lastIndexOf(" ");
  if (lastSpace > maxSize * 0.7) {
    return lastSpace;
  }

  return maxSize;
}

export function getChunkInfo(chunks: string[]): {
  total: number;
  sizes: number[];
} {
  return {
    total: chunks.length,
    sizes: chunks.map((c) => c.length),
  };
}
