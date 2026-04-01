import { Command } from "commander";
import inquirer from "inquirer";
import chalk from "chalk";
import { loadPlugins, getPluginCategories } from "../core/agents/loader.js";
import { runAgent } from "../core/orchestrator/run.js";
import { configExists } from "../utils/config.js";
import glob from "fast-glob";
import type { Plugin } from "../types.js";

const KESMO_BANNER = `
${chalk.cyan("██╗  ██╗███████╗███████╗███╗   ███╗ ██████╗ ")}
${chalk.cyan("██║ ██╔╝██╔════╝██╔════╝████╗ ████║██╔═══██╗")}
${chalk.cyan("█████╔╝ █████╗  ███████╗██╔████╔██║██║   ██║")}
${chalk.cyan("██╔═██╗ ██╔══╝  ╚════██║██║╚██╔╝██║██║   ██║")}
${chalk.cyan("██║  ██╗███████╗███████║██║ ╚═╝ ██║╚██████╔╝")}
${chalk.cyan("╚═╝  ╚═╝╚══════╝╚══════╝╚═╝     ╚═╝ ╚═════╝ ")}
`;

const CATEGORY_COLORS: Record<string, (text: string) => string> = {
  security: chalk.red,
  quality: chalk.green,
  performance: chalk.yellow,
  debugging: chalk.magenta,
  documentation: chalk.blue,
  testing: chalk.cyan,
  system: chalk.gray,
  config: chalk.gray,
  agents: chalk.white,
  analysis: chalk.blue,
  api: chalk.cyan,
  memory: chalk.magenta,
  architecture: chalk.yellow,
  accessibility: chalk.green,
  i18n: chalk.blue,
  observability: chalk.cyan,
  meta: chalk.gray,
};

export const pluginCommand = new Command("plugin")
  .description("Select and run an AI analysis agent")
  .option("-l, --list", "List all available plugins")
  .option("-c, --category <category>", "Filter plugins by category")
  .option("-v, --verbose", "Show verbose output")
  .option("--max-files <number>", "Limit number of files to analyze", parseInt)
  .action(async (options) => {
    if (!configExists()) {
      console.log(chalk.red("Error: ") + chalk.white("KESMO is not configured."));
      console.log(chalk.gray("Run ") + chalk.cyan("kesmo") + chalk.gray(" first to set up."));
      process.exit(1);
    }

    let plugins: Plugin[];
    try {
      plugins = loadPlugins();
    } catch (error) {
      console.log(chalk.red("Error: ") + chalk.white(error instanceof Error ? error.message : "Failed to load plugins"));
      process.exit(1);
    }

    if (options.list) {
      displayPluginList(plugins);
      return;
    }

    if (options.category) {
      plugins = plugins.filter((p) => p.category === options.category);
      if (plugins.length === 0) {
        const categories = getPluginCategories();
        console.log(chalk.red("Error: ") + chalk.white(`No plugins in category "${options.category}"`));
        console.log(chalk.gray("Available: ") + categories.join(", "));
        process.exit(1);
      }
    }

    // Beautiful plugin selection UI
    console.clear();
    console.log(KESMO_BANNER);
    console.log(chalk.bold.white("Select an Analysis Agent\n"));

    const choices = plugins.map((p) => {
      const colorFn = CATEGORY_COLORS[p.category] || chalk.white;
      return {
        name: colorFn("●") + " " + chalk.white(p.name) + " " + chalk.dim(`[${p.category}]`),
        value: p.id,
        short: p.name,
      };
    });

    const { selected } = await inquirer.prompt({
      type: "select",
      name: "selected",
      message: chalk.white("Choose agent:"),
      choices,
      pageSize: 15,
    });

    const plugin = plugins.find((p) => p.id === selected);
    if (!plugin) {
      console.log(chalk.red("Error: ") + chalk.white("Plugin not found"));
      process.exit(1);
    }

    // Ask about scope: entire codebase or specific file
    console.log();
    console.log(chalk.bold.white(`Scope for: ${plugin.name}\n`));
    
    const { scope } = await inquirer.prompt({
      type: "select",
      name: "scope",
      message: chalk.white("Analyze:"),
      choices: [
        { name: chalk.green("●") + " Entire codebase " + chalk.dim("(recommended)"), value: "all" },
        { name: chalk.blue("●") + " Specific file", value: "file" },
      ],
    });

    let selectedFile: string | undefined;
    let maxFiles = options.maxFiles;

    if (scope === "file") {
      const files = await glob(
        "**/*.{ts,tsx,js,jsx,py,java,go,rs,rb,php,cs,cpp,c,swift,kt}",
        {
          ignore: ["node_modules", "dist", "build", ".git", "vendor", "__pycache__", "target", ".next", "coverage"],
        },
      );

      const slicedFiles = files.slice(0, 50);

      if (slicedFiles.length === 0) {
        console.log(chalk.yellow("Warning: ") + chalk.white("No code files found in this directory"));
        process.exit(1);
      }

      const { file } = await inquirer.prompt({
        type: "select",
        name: "file",
        message: chalk.white("Select file:"),
        choices: slicedFiles.map((f) => ({
          name: chalk.dim("  ") + f,
          value: f,
        })),
        pageSize: 15,
      });

      selectedFile = file;
      maxFiles = 1;
    }

    try {
      console.log();
      console.log(chalk.cyan("Analyzing...") + chalk.dim(" (this may take a moment)"));
      console.log();
      await runAgent(plugin, {
        verbose: options.verbose,
        maxFiles,
        specificFile: selectedFile,
      });
    } catch (error) {
      console.log(chalk.red("Error: ") + chalk.white(error instanceof Error ? error.message : "Analysis failed"));
      process.exit(1);
    }
  });

function displayPluginList(plugins: Plugin[]): void {
  console.clear();
  console.log(KESMO_BANNER);
  console.log(chalk.bold.white("Available Analysis Agents\n"));

  const byCategory = new Map<string, Plugin[]>();
  for (const plugin of plugins) {
    const list = byCategory.get(plugin.category) || [];
    list.push(plugin);
    byCategory.set(plugin.category, list);
  }

  const sortedCategories = Array.from(byCategory.keys()).sort();

  for (const category of sortedCategories) {
    const categoryPlugins = byCategory.get(category) || [];
    const colorFn = CATEGORY_COLORS[category] || chalk.white;
    console.log(colorFn("■ " + category.toUpperCase()) + chalk.dim(` (${categoryPlugins.length})`));

    for (const p of categoryPlugins) {
      console.log(chalk.gray("  ├─ ") + chalk.white(p.name));
      if (p.description) {
        console.log(chalk.gray("  │  ") + chalk.dim(p.description.slice(0, 60) + (p.description.length > 60 ? "..." : "")));
      }
    }
    console.log();
  }

  console.log(chalk.dim("─".repeat(50)));
  console.log(chalk.white(`Total: ${plugins.length} agents`));
  console.log();
  console.log(chalk.gray("Usage:"));
  console.log(chalk.gray("  kesmo plugin              ") + chalk.dim("Interactive selection"));
  console.log(chalk.gray("  kesmo plugin --list       ") + chalk.dim("Show this list"));
  console.log(chalk.gray("  kesmo plugin -c security  ") + chalk.dim("Filter by category"));
  console.log();
}
