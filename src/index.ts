export {
  loadConfig,
  saveConfig,
  configExists,
  deleteConfig,
  getConfigPath,
} from "./utils/config.js";
export { ensureSetup, runSetup } from "./utils/setup.js";
export { chunk, getChunkInfo } from "./utils/chunk.js";
export { createLogger, type Logger } from "./utils/logger.js";

export {
  loadPlugins,
  loadPlugin,
  getPluginCategories,
  getPromptsPath,
} from "./core/agents/loader.js";
export {
  scanFiles,
  getScanStats,
  type ScanOptions,
} from "./core/scanner/scanner.js";
export { runLLM } from "./core/provider/index.js";
export {
  runAgent,
  runAllAgents,
  type RunOptions,
} from "./core/orchestrator/run.js";

export {
  optimizeCode,
  removeComments,
  removeConsoleLogs,
  normalizeWhitespace,
  detectLanguage,
} from "./core/codeOptimizer.js";
export {
  optimizePrompt,
  normalizePromptWhitespace,
  removePromptRedundancy,
  buildFinalPrompt,
} from "./core/promptOptimizer.js";
export {
  estimateTokens,
  enforceTokenLimit,
  getTokenStats,
  splitByTokenLimit,
} from "./core/tokenLimiter.js";

export type {
  KesmoConfig,
  ProviderType,
  Plugin,
  ScannedFile,
  ChunkedFile,
  AnalysisResult,
  LogEntry,
} from "./types.js";
