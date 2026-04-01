import fs from "fs";
import path from "path";
import type { KesmoConfig } from "../types.js";

const CONFIG_FILE = ".kesmorc.json";

export function getConfigPath(): string {
  return path.join(process.cwd(), CONFIG_FILE);
}

export function configExists(): boolean {
  return fs.existsSync(getConfigPath());
}

export function loadConfig(): KesmoConfig {
  const configPath = getConfigPath();

  if (!fs.existsSync(configPath)) {
    throw new Error(
      "Configuration not found. Run `kesmo` first to set up your provider.",
    );
  }

  try {
    const raw = fs.readFileSync(configPath, "utf-8");
    const config = JSON.parse(raw) as KesmoConfig;

    if (!config.provider || !config.apiKey || !config.model) {
      throw new Error(
        "Invalid configuration. Please run `kesmo` to reconfigure.",
      );
    }

    return config;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(
        "Configuration file is corrupted. Please delete .kesmorc.json and run `kesmo` again.",
      );
    }
    throw error;
  }
}

export function saveConfig(config: KesmoConfig): void {
  fs.writeFileSync(getConfigPath(), JSON.stringify(config, null, 2));
}

export function deleteConfig(): void {
  const configPath = getConfigPath();
  if (fs.existsSync(configPath)) {
    fs.unlinkSync(configPath);
  }
}
