const SINGLE_LINE_COMMENT = /\/\/.*$/gm;
const MULTI_LINE_COMMENT = /\/\*[\s\S]*?\*\//g;
const HASH_COMMENT = /#.*$/gm;
const DOCSTRING = /"""[\s\S]*?"""|'''[\s\S]*?'''/g;

export function removeComments(code: string, language?: string): string {
  let result = code;

  if (language === "py" || language === "python") {
    result = result.replace(HASH_COMMENT, "");
    result = result.replace(DOCSTRING, "");
  } else {
    result = result.replace(MULTI_LINE_COMMENT, "");
    result = result.replace(SINGLE_LINE_COMMENT, "");
    result = result.replace(HASH_COMMENT, "");
  }

  return result;
}

export function removeConsoleLogs(code: string): string {
  const patterns = [
    /console\.(log|debug|info|warn|error|trace)\([^)]*\);?/g,
    /print\([^)]*\);?/g,
    /System\.out\.println?\([^)]*\);?/g,
    /fmt\.Print(ln|f)?\([^)]*\);?/g,
  ];

  let result = code;
  for (const pattern of patterns) {
    result = result.replace(pattern, "");
  }

  return result;
}

export function normalizeWhitespace(code: string): string {
  return code
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function detectLanguage(filePath: string): string {
  const ext = filePath.split(".").pop()?.toLowerCase() || "";
  const langMap: Record<string, string> = {
    ts: "typescript",
    tsx: "typescript",
    js: "javascript",
    jsx: "javascript",
    py: "python",
    java: "java",
    go: "go",
    rs: "rust",
    rb: "ruby",
    php: "php",
    cs: "csharp",
    cpp: "cpp",
    c: "c",
    swift: "swift",
    kt: "kotlin",
  };
  return langMap[ext] || "unknown";
}

export function optimizeCode(code: string, filePath?: string): string {
  const language = filePath ? detectLanguage(filePath) : undefined;

  let optimized = removeComments(code, language);
  optimized = removeConsoleLogs(optimized);
  optimized = normalizeWhitespace(optimized);

  return optimized;
}
