import fg from "fast-glob";
import fs from "fs";
import path from "path";
import type { ScannedFile } from "../../types.js";

const DEFAULT_PATTERNS = [
  "**/*.ts",
  "**/*.tsx",
  "**/*.js",
  "**/*.jsx",
  "**/*.py",
  "**/*.java",
  "**/*.go",
  "**/*.rs",
  "**/*.rb",
  "**/*.php",
  "**/*.cs",
  "**/*.cpp",
  "**/*.c",
  "**/*.swift",
  "**/*.kt",
];

const DEFAULT_IGNORE = [
  "**/node_modules/**",
  "**/dist/**",
  "**/build/**",
  "**/.git/**",
  "**/vendor/**",
  "**/__pycache__/**",
  "**/target/**",
  "**/.next/**",
  "**/coverage/**",
  "**/*.min.js",
  "**/*.bundle.js",
  "**/package-lock.json",
  "**/yarn.lock",
];

export interface ScanOptions {
  patterns?: string[];
  ignore?: string[];
  maxFileSize?: number;
  cwd?: string;
}

export async function scanFiles(
  options: ScanOptions = {},
): Promise<ScannedFile[]> {
  const {
    patterns = DEFAULT_PATTERNS,
    ignore = DEFAULT_IGNORE,
    maxFileSize = 100000,
    cwd = process.cwd(),
  } = options;

  const files = await fg(patterns, {
    ignore,
    cwd,
    absolute: true,
    onlyFiles: true,
    followSymbolicLinks: false,
  });

  const scannedFiles: ScannedFile[] = [];

  for (const filePath of files) {
    try {
      const stats = fs.statSync(filePath);

      if (stats.size > maxFileSize) {
        continue;
      }

      const content = fs.readFileSync(filePath, "utf-8");
      const relativePath = path.relative(cwd, filePath);

      scannedFiles.push({
        path: relativePath,
        content,
      });
    } catch {
      continue;
    }
  }

  return scannedFiles;
}

export function getScanStats(files: ScannedFile[]): {
  totalFiles: number;
  totalSize: number;
  byExtension: Record<string, number>;
} {
  const byExtension: Record<string, number> = {};
  let totalSize = 0;

  for (const file of files) {
    totalSize += file.content.length;
    const ext = path.extname(file.path).slice(1) || "unknown";
    byExtension[ext] = (byExtension[ext] || 0) + 1;
  }

  return {
    totalFiles: files.length,
    totalSize,
    byExtension,
  };
}
