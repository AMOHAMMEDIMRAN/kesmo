import { Command } from "commander";
import chalk from "chalk";
import inquirer from "inquirer";
import { loadPlugins } from "../core/agents/loader.js";
import { runAllAgents } from "../core/orchestrator/run.js";
import { configExists } from "../utils/config.js";

const KESMO_BANNER = `
${chalk.cyan("██╗  ██╗")}${chalk.blue("███████╗")}${chalk.magenta("███████╗")}${chalk.red("███╗   ███╗")}${chalk.yellow(" ██████╗ ")}
${chalk.cyan("██║ ██╔╝")}${chalk.blue("██╔════╝")}${chalk.magenta("██╔════╝")}${chalk.red("████╗ ████║")}${chalk.yellow("██╔═══██╗")}
${chalk.cyan("█████╔╝ ")}${chalk.blue("█████╗  ")}${chalk.magenta("███████╗")}${chalk.red("██╔████╔██║")}${chalk.yellow("██║   ██║")}
${chalk.cyan("██╔═██╗ ")}${chalk.blue("██╔══╝  ")}${chalk.magenta("╚════██║")}${chalk.red("██║╚██╔╝██║")}${chalk.yellow("██║   ██║")}
${chalk.cyan("██║  ██╗")}${chalk.blue("███████╗")}${chalk.magenta("███████║")}${chalk.red("██║ ╚═╝ ██║")}${chalk.yellow("╚██████╔╝")}
${chalk.cyan("╚═╝  ╚═╝")}${chalk.blue("╚══════╝")}${chalk.magenta("╚══════╝")}${chalk.red("╚═╝     ╚═╝")}${chalk.yellow(" ╚═════╝ ")}
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
  analysis: chalk.cyan,
  api: chalk.blue,
  memory: chalk.magenta,
  architecture: chalk.yellow,
  accessibility: chalk.green,
  i18n: chalk.blue,
  observability: chalk.cyan,
  meta: chalk.gray,
};

export const scanCommand = new Command("scan")
  .description("Run all AI analysis agents on the codebase")
  .option("-v, --verbose", "Show verbose output")
  .option("--max-files <number>", "Limit number of files per agent", parseInt)
  .option("-y, --yes", "Skip confirmation prompt")
  .action(async (options) => {
    if (!configExists()) {
      console.log(chalk.red("KESMO is not configured. Run `kesmo` first to set up."));
      process.exit(1);
    }

    let plugins;
    try {
      plugins = loadPlugins();
    } catch (error) {
      console.log(chalk.red(`${error instanceof Error ? error.message : "Failed to load plugins"}`));
      process.exit(1);
    }

    console.clear();
    console.log(KESMO_BANNER);
    console.log(chalk.gray("  Full Codebase Scan"));
    console.log(chalk.dim("─".repeat(50)));
    console.log();
    console.log(chalk.white(`Found ${chalk.bold.cyan(plugins.length)} agents ready to analyze\n`));

    // Group by category
    const byCategory = new Map<string, typeof plugins>();
    for (const plugin of plugins) {
      const list = byCategory.get(plugin.category) || [];
      list.push(plugin);
      byCategory.set(plugin.category, list);
    }

    for (const [category, categoryPlugins] of byCategory) {
      const color = CATEGORY_COLORS[category] || chalk.white;
      console.log(color("*") + chalk.white(` ${category.toUpperCase()}`) + chalk.gray(` (${categoryPlugins.length})`));
      for (const plugin of categoryPlugins) {
        console.log(chalk.gray(`  |-- `) + chalk.dim(plugin.name));
      }
      console.log();
    }

    if (!options.yes) {
      const { confirm } = await inquirer.prompt({
        type: "confirm",
        name: "confirm",
        message: chalk.white(`Run all ${plugins.length} agents? (This may take a while)`),
        default: true,
      }) as { confirm: boolean };

      if (!confirm) {
        console.log(chalk.yellow("Scan cancelled."));
        return;
      }
    }

    try {
      const startTime = Date.now();
      console.log();
      console.log(chalk.dim("═".repeat(50)));
      console.log(chalk.bold.white("Starting Analysis..."));
      console.log(chalk.dim("═".repeat(50)));
      console.log();

      const results = await runAllAgents(plugins, {
        verbose: options.verbose,
        maxFiles: options.maxFiles,
      });

      const duration = Math.round((Date.now() - startTime) / 1000);
      const totalResults = Array.from(results.values()).reduce((sum, r) => sum + r.length, 0);

      console.log();
      console.log(chalk.dim("═".repeat(50)));
      console.log(chalk.green("✓") + chalk.bold.white(" Scan Complete"));
      console.log(chalk.dim("═".repeat(50)));
      console.log();
      console.log(chalk.white("Summary:"));
      console.log(chalk.gray("  Agents run:     ") + chalk.cyan(results.size));
      console.log(chalk.gray("  Total analyses: ") + chalk.cyan(totalResults));
      console.log(chalk.gray("  Duration:       ") + chalk.cyan(duration + "s"));
      console.log(chalk.gray("  Results saved:  ") + chalk.cyan("./logs"));
      console.log();
    } catch (error) {
      console.log(chalk.red(`Scan failed: ${error instanceof Error ? error.message : "Unknown error"}`));
      process.exit(1);
    }
  });
