import chalk from "chalk";
import ora from "ora";
import { scanFiles, getScanStats } from "../scanner/scanner.js";
import { chunk } from "../../utils/chunk.js";
import { runLLM } from "../provider/index.js";
import { createLogger, type Logger } from "../../utils/logger.js";
import { optimizeCode } from "../codeOptimizer.js";
import { optimizePrompt, buildFinalPrompt } from "../promptOptimizer.js";
import { enforceTokenLimit, getTokenStats } from "../tokenLimiter.js";
import { readFileSync } from "fs";
import { extname } from "path";
import type { Plugin, ScannedFile, AnalysisResult, AnalysisOptions } from "../../types.js";

export type RunOptions = AnalysisOptions & {
  chunkSize?: number;
  tokenLimit?: number;
};

function formatAnalysisOutput(result: string, filePath: string): void {
  const lines = result.split("\n");
  
  console.log();
  console.log(chalk.dim("─".repeat(60)));
  console.log(chalk.bold.white(`Analysis Results for: ${filePath}`));
  console.log(chalk.dim("─".repeat(60)));
  console.log();
  
  for (const line of lines) {
    // Format headers
    if (line.startsWith("##") || line.startsWith("**")) {
      console.log(chalk.bold.cyan(line.replace(/[#*]/g, "").trim()));
    }
    // Format bullet points
    else if (line.trim().startsWith("-") || line.trim().startsWith("*") || line.trim().startsWith("•")) {
      console.log(chalk.gray("  ") + chalk.white(line.trim()));
    }
    // Format numbered items
    else if (/^\d+\./.test(line.trim())) {
      console.log(chalk.gray("  ") + chalk.white(line.trim()));
    }
    // Format code blocks
    else if (line.trim().startsWith("```")) {
      console.log(chalk.dim(line));
    }
    // Format warnings/issues
    else if (line.toLowerCase().includes("warning") || line.toLowerCase().includes("issue")) {
      console.log(chalk.yellow(line));
    }
    // Format errors/critical
    else if (line.toLowerCase().includes("error") || line.toLowerCase().includes("critical") || line.toLowerCase().includes("vulnerability")) {
      console.log(chalk.red(line));
    }
    // Format success/good
    else if (line.toLowerCase().includes("good") || line.toLowerCase().includes("passed") || line.toLowerCase().includes("clean")) {
      console.log(chalk.green(line));
    }
    // Normal text
    else if (line.trim()) {
      console.log(chalk.white(line));
    }
    else {
      console.log(); // Empty line
    }
  }
  
  console.log();
  console.log(chalk.dim("─".repeat(60)));
}

export async function runAgent(
  plugin: Plugin,
  options: RunOptions = {},
): Promise<AnalysisResult[]> {
  const {
    verbose = false,
    maxFiles,
    chunkSize = 2000,
    tokenLimit = 8000,
    specificFile,
  } = options;

  const logger = createLogger(plugin.name);
  logger.info(`Starting analysis with agent: ${plugin.name}`);

  console.log(chalk.bold.white(`Agent: ${plugin.name}`));
  console.log(chalk.gray(`Category: ${plugin.category}`));
  console.log();

  const spinner = ora({ text: "Scanning files...", color: "cyan" }).start();

  let files: ScannedFile[];
  try {
    if (specificFile) {
      try {
        const content = readFileSync(specificFile, "utf-8");
        files = [{ path: specificFile, content }];
        spinner.succeed(chalk.white(`Loaded: ${specificFile}`));
      } catch (err) {
        spinner.fail(chalk.red("Failed to read file"));
        throw new Error(`Cannot read file: ${specificFile}`);
      }
    } else {
      files = await scanFiles();

      if (maxFiles && files.length > maxFiles) {
        files = files.slice(0, maxFiles);
      }

      const stats = getScanStats(files);
      spinner.succeed(chalk.white(`Found ${stats.totalFiles} files`));

      if (verbose) {
        console.log(chalk.gray(`  Extensions: ${Object.entries(stats.byExtension).map(([k, v]) => `${k}(${v})`).join(", ")}`));
      }
    }
  } catch (error) {
    spinner.fail(chalk.red("Failed to scan files"));
    logger.error("Scan failed", { error: String(error) });
    throw error;
  }

  if (files.length === 0) {
    console.log(chalk.yellow("No files found to analyze."));
    return [];
  }

  const results: AnalysisResult[] = [];
  const optimizedAgentPrompt = optimizePrompt(plugin.prompt);

  for (let i = 0; i < files.length; i++) {
    const file = files[i]!;
    const progress = `[${i + 1}/${files.length}]`;

    console.log();
    console.log(chalk.cyan(progress) + chalk.white(` ${file.path}`));

    const optimizedCode = optimizeCode(file.content, file.path);
    const chunks = chunk(optimizedCode, chunkSize);

    for (let j = 0; j < chunks.length; j++) {
      const chunkContent = chunks[j]!;
      const chunkLabel = chunks.length > 1 ? ` (chunk ${j + 1}/${chunks.length})` : "";

      const analysisSpinner = ora({ 
        text: `Analyzing${chunkLabel}...`, 
        color: "cyan",
        spinner: "dots"
      }).start();

      try {
        const fullPrompt = buildFinalPrompt(optimizedAgentPrompt, chunkContent, file.path);
        const finalPrompt = enforceTokenLimit(fullPrompt, tokenLimit);

        if (verbose) {
          const stats = getTokenStats(finalPrompt);
          console.log(chalk.gray(`  Tokens: ~${stats.estimatedTokens}`));
        }

        const result = await runLLM(finalPrompt);

        analysisSpinner.succeed(chalk.white(`Analyzed${chunkLabel}`));

        // Format and display the result nicely
        formatAnalysisOutput(result, file.path);

        logger.result(file.path, result);

        results.push({
          file: file.path,
          chunk: j + 1,
          totalChunks: chunks.length,
          result,
          timestamp: new Date(),
        });
      } catch (error) {
        analysisSpinner.fail(chalk.red(`Failed${chunkLabel}`));

        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        console.log(chalk.red(`  Error: ${errorMessage}`));
        logger.error(`Analysis failed for ${file.path}`, { error: errorMessage, chunk: j + 1 });

        results.push({
          file: file.path,
          chunk: j + 1,
          totalChunks: chunks.length,
          result: `ERROR: ${errorMessage}`,
          timestamp: new Date(),
        });
      }
    }
  }

  console.log();
  console.log(chalk.dim("═".repeat(60)));
  console.log(chalk.green("✓") + chalk.bold.white(` Analysis Complete`));
  console.log(chalk.gray(`  Files processed: ${files.length}`));
  console.log(chalk.gray(`  Results saved: ${logger.getLogPath()}`));
  console.log(chalk.dim("═".repeat(60)));
  console.log();

  logger.info("Analysis complete", { filesProcessed: files.length, resultsCount: results.length });

  return results;
}

export async function runAllAgents(
  plugins: Plugin[],
  options: RunOptions = {},
): Promise<Map<string, AnalysisResult[]>> {
  const allResults = new Map<string, AnalysisResult[]>();

  console.log(chalk.bold.white(`Running ${plugins.length} agents...\n`));

  for (let i = 0; i < plugins.length; i++) {
    const plugin = plugins[i]!;
    console.log(chalk.dim("─".repeat(60)));
    console.log(chalk.cyan(`[${i + 1}/${plugins.length}]`) + chalk.white(` ${plugin.name}`));
    
    try {
      const results = await runAgent(plugin, options);
      allResults.set(plugin.id, results);
    } catch (error) {
      console.log(chalk.red(`Error: ${error instanceof Error ? error.message : "Unknown error"}`));
      allResults.set(plugin.id, []);
    }
  }

  return allResults;
}
