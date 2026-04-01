import fs from "fs";
import path from "path";
import type { Plugin } from "../../types.js";

const PROMPTS_DIR = "prompts";

export function getPromptsPath(): string {
  return path.join(process.cwd(), PROMPTS_DIR);
}

export function loadPlugins(): Plugin[] {
  const dir = getPromptsPath();

  if (!fs.existsSync(dir)) {
    throw new Error(
      `Prompts directory not found. Please create a "${PROMPTS_DIR}" folder with agent JSON files.`,
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
      const parsed = JSON.parse(raw) as Partial<Plugin>;

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
