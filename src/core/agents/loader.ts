import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import type { Plugin } from "../../types.js";

const PROMPTS_DIR = "prompts";

function getBundledPromptsPath(): string {
  const currentFile = fileURLToPath(import.meta.url);
  const currentDir = path.dirname(currentFile);
  return path.resolve(currentDir, "../../../../", PROMPTS_DIR);
}

export function getPromptsPath(): string {
  const cwdPrompts = path.join(process.cwd(), PROMPTS_DIR);
  if (fs.existsSync(cwdPrompts)) {
    return cwdPrompts;
  }

  return getBundledPromptsPath();
}

export function loadPlugins(): Plugin[] {
  const dir = getPromptsPath();

  if (!fs.existsSync(dir)) {
    const cwdPrompts = path.join(process.cwd(), PROMPTS_DIR);
    const bundledPrompts = getBundledPromptsPath();
    throw new Error(
      `Prompts directory not found. Looked in "${cwdPrompts}" and "${bundledPrompts}".`,
    );
  }

  const files = fs.readdirSync(dir);
  const jsonFiles = files.filter((f) => f.endsWith(".json"));
  const mdFiles = files.filter((f) => f.endsWith(".md"));

  const plugins: Plugin[] = [];

  for (const file of jsonFiles) {
    try {
      const filePath = path.join(dir, file);
      const raw = fs.readFileSync(filePath, "utf-8");
      const normalized = raw.replace(/^\uFEFF/, "");
      const parsed = JSON.parse(normalized) as Partial<Plugin>;

      if (!parsed.name || !parsed.prompt) {
        continue;
      }

      plugins.push({
        id: file.replace(".json", ""),
        name: parsed.name,
        category: parsed.category || "general",
        prompt: parsed.prompt,
        description: parsed.description,
      });
    } catch {
      continue;
    }
  }

  for (const file of mdFiles) {
    try {
      const filePath = path.join(dir, file);
      const content = fs.readFileSync(filePath, "utf-8");
      const name = extractNameFromMd(file, content);

      plugins.push({
        id: file.replace(".md", ""),
        name,
        category: "markdown",
        prompt: content,
      });
    } catch {
      continue;
    }
  }

  if (plugins.length === 0) {
    throw new Error(
      `No valid plugins found in "${PROMPTS_DIR}". Add JSON files with {name, category, prompt} format.`,
    );
  }

  return plugins.sort((a, b) => a.name.localeCompare(b.name));
}

function extractNameFromMd(filename: string, content: string): string {
  const headerMatch = content.match(/^#\s+(.+)$/m);
  if (headerMatch?.[1]) {
    return headerMatch[1].trim();
  }

  return filename
    .replace(".md", "")
    .replace(/^\d+_/, "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function loadPlugin(pluginId: string): Plugin {
  const plugins = loadPlugins();
  const plugin = plugins.find((p) => p.id === pluginId);

  if (!plugin) {
    throw new Error(`Plugin "${pluginId}" not found`);
  }

  return plugin;
}

export function getPluginCategories(): string[] {
  const plugins = loadPlugins();
  const categories = new Set(plugins.map((p) => p.category));
  return Array.from(categories).sort();
}
