import fs from "fs";
import path from "path";

const LOGS_DIR = "logs";

function ensureLogsDir(): void {
  const logsPath = path.join(process.cwd(), LOGS_DIR);
  if (!fs.existsSync(logsPath)) {
    fs.mkdirSync(logsPath, { recursive: true });
  }
}

function formatTimestamp(date: Date): string {
  return date.toISOString().replace(/[:.]/g, "-");
}

function getLogFileName(agentName: string): string {
  const timestamp = formatTimestamp(new Date());
  const sanitizedName = agentName.replace(/[^a-zA-Z0-9-_]/g, "_");
  return `${timestamp}_${sanitizedName}.log`;
}

export function createLogger(agentName: string) {
  ensureLogsDir();
  const logFile = path.join(process.cwd(), LOGS_DIR, getLogFileName(agentName));

  const log = (
    level: string,
    message: string,
    data?: Record<string, unknown>,
  ): void => {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      agent: agentName,
      message,
      ...(data && { data }),
    };

    const line = JSON.stringify(entry) + "\n";
    fs.appendFileSync(logFile, line);
  };

  return {
    info: (message: string, data?: Record<string, unknown>) =>
      log("INFO", message, data),
    warn: (message: string, data?: Record<string, unknown>) =>
      log("WARN", message, data),
    error: (message: string, data?: Record<string, unknown>) =>
      log("ERROR", message, data),
    result: (file: string, result: string) => {
      log("RESULT", `Analysis for ${file}`, {
        file,
        result: result.slice(0, 500),
      });
    },
    getLogPath: () => logFile,
  };
}

export type Logger = ReturnType<typeof createLogger>;
