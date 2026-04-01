#!/usr/bin/env node

import { Command } from "commander";
import chalk from "chalk";
import { pluginCommand } from "../src/commands/plugin.js";
import { scanCommand } from "../src/commands/scan.js";
import { ensureSetup, runSetup } from "../src/utils/setup.js";

const program = new Command();

program
  .name("kesmo")
  .description("KESMO - AI Code Analysis Engine")
  .version("1.0.0");

program.action(async () => {
  try {
    await ensureSetup();
  } catch (error) {
    console.log(
      chalk.red(
        `❌ Setup failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      ),
    );
    process.exit(1);
  }
});

program.addCommand(pluginCommand);
program.addCommand(scanCommand);

program
  .command("config")
  .description("View or update KESMO configuration")
  .option("-s, --show", "Show current configuration")
  .option("-u, --update", "Update configuration (run setup wizard)")
  .option("--set-key <key>", "Set API key directly")
  .option("--set-model <model>", "Set model directly")
  .option("--set-provider <provider>", "Set provider (openai/claude/openrouter/google)")
  .action(async (options) => {
    const { loadConfig, configExists, saveConfig } = await import("../src/utils/config.js");

    if (options.show || (!options.update && !options.setKey && !options.setModel && !options.setProvider)) {
      if (!configExists()) {
        console.log(chalk.yellow("No configuration found. Run `kesmo` to set up."));
        return;
      }
      
      const config = loadConfig();
      console.log(chalk.cyan("\n📋 Current KESMO Configuration\n"));
      console.log(`  Provider: ${chalk.green(config.provider)}`);
      console.log(`  Model:    ${chalk.green(config.model)}`);
      console.log(`  API Key:  ${chalk.dim(config.apiKey.slice(0, 8) + "..." + config.apiKey.slice(-4))}`);
      console.log(chalk.dim("\nConfig file: .kesmorc.json\n"));
      return;
    }

    if (options.update) {
      await runSetup();
      return;
    }

    if (!configExists()) {
      console.log(chalk.yellow("No configuration found. Run `kesmo` first to set up."));
      return;
    }

    const config = loadConfig();
    let updated = false;

    if (options.setProvider) {
      const validProviders = ["openai", "claude", "openrouter", "google"];
      if (!validProviders.includes(options.setProvider)) {
        console.log(chalk.red(`❌ Invalid provider. Use: ${validProviders.join(", ")}`));
        return;
      }
      config.provider = options.setProvider;
      updated = true;
      console.log(chalk.green(`✅ Provider updated to: ${options.setProvider}`));
    }

    if (options.setKey) {
      if (options.setKey.length < 10) {
        console.log(chalk.red("❌ API key seems too short"));
        return;
      }
      config.apiKey = options.setKey;
      updated = true;
      console.log(chalk.green(`✅ API key updated`));
    }

    if (options.setModel) {
      config.model = options.setModel;
      updated = true;
      console.log(chalk.green(`✅ Model updated to: ${options.setModel}`));
    }

    if (updated) {
      saveConfig(config);
      console.log(chalk.dim("\nConfiguration saved to .kesmorc.json"));
    }
  });

program
  .command("test")
  .description("Test API connection with current configuration")
  .action(async () => {
    const { configExists, loadConfig } = await import("../src/utils/config.js");
    const { runLLM } = await import("../src/core/provider/index.js");
    const ora = await import("ora");

    if (!configExists()) {
      console.log(chalk.red("❌ No configuration found. Run `kesmo` first."));
      process.exit(1);
    }

    const config = loadConfig();
    console.log(chalk.cyan("\n🧪 Testing API Connection\n"));
    console.log(`  Provider: ${config.provider}`);
    console.log(`  Model:    ${config.model}`);
    console.log();

    const spinner = ora.default("Sending test request...").start();

    try {
      const response = await runLLM("Say 'KESMO connection successful!' in exactly those words.");
      spinner.succeed("API connection successful!");
      console.log(chalk.green("\n✅ Response received:"));
      console.log(chalk.dim(response.slice(0, 200)));
      console.log(chalk.green("\n🎉 Your configuration is working correctly!\n"));
    } catch (error) {
      spinner.fail("API connection failed");
      console.log(chalk.red(`\n❌ Error: ${error instanceof Error ? error.message : "Unknown error"}`));
      console.log(chalk.yellow("\nTroubleshooting:"));
      console.log(chalk.dim("  • Check your API key is correct"));
      console.log(chalk.dim("  • Verify the model name is valid for your provider"));
      console.log(chalk.dim("  • Ensure you have API credits/quota available"));
      console.log(chalk.dim("  • Run `kesmo config --update` to reconfigure\n"));
      process.exit(1);
    }
  });

program
  .command("reset")
  .description("Reset KESMO configuration")
  .action(async () => {
    const { deleteConfig, configExists } =
      await import("../src/utils/config.js");
    const inquirer = await import("inquirer");

    if (!configExists()) {
      console.log(chalk.yellow("No configuration found."));
      return;
    }

    const { confirm } = await inquirer.default.prompt({
      type: "confirm",
      name: "confirm",
      message: "Are you sure you want to reset the configuration?",
      default: false,
    }) as { confirm: boolean };

    if (confirm) {
      deleteConfig();
      console.log(
        chalk.green("✅ Configuration deleted. Run `kesmo` to set up again."),
      );
    }
  });

process.on("unhandledRejection", (error) => {
  console.log(
    chalk.red(
      `\n❌ Unexpected error: ${error instanceof Error ? error.message : "Unknown error"}`,
    ),
  );
  process.exit(1);
});

program.parse();
