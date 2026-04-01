# KESMO - AI Code Analysis Engine

A production-ready CLI tool that connects to LLM providers to perform intelligent code analysis using customizable AI agents.

## Features

- 🔌 **Multi-Provider Support**: OpenAI, Claude, OpenRouter, Google Gemini
- 🤖 **Plugin System**: Load AI agents from JSON/Markdown files
- 📂 **Full Codebase Scanning**: Supports TS, JS, Python, Java, Go, Rust, and more
- ⚡ **Smart Chunking**: Intelligently splits large files preserving code structure
- 🔧 **Prompt Optimization**: Removes comments, console logs, and redundant whitespace
- 📝 **Logging**: Saves analysis results to `/logs` directory
- 🛡️ **Error Handling**: Graceful handling of API errors and edge cases

## Installation

```bash
npm install
npm run build
npm link
```

## Quick Start

### 1. Setup

```bash
kesmo
```

This will prompt you to:

- Select your LLM provider (OpenAI, Claude, OpenRouter, Google)
- Enter your API key
- Choose a model

Configuration is saved to `.kesmorc.json`.

### 2. Run a Single Agent

```bash
kesmo plugin
```

Select an agent from the interactive list and run it on your codebase.

### 3. Run All Agents

```bash
kesmo scan
```

Runs all available agents sequentially on your codebase.

## Commands

| Command                      | Description                             |
| ---------------------------- | --------------------------------------- |
| `kesmo`                      | Initial setup (creates `.kesmorc.json`) |
| `kesmo plugin`               | Select and run a single agent           |
| `kesmo plugin --list`        | List all available agents               |
| `kesmo plugin -c <category>` | Filter agents by category               |
| `kesmo scan`                 | Run all agents on the codebase          |
| `kesmo scan -y`              | Run all agents without confirmation     |
| `kesmo reset`                | Delete configuration and start over     |

## Options

- `-v, --verbose` - Show detailed output including token counts
- `--max-files <n>` - Limit number of files to analyze
- `-y, --yes` - Skip confirmation prompts

## Creating Agents

Add JSON files to the `/prompts` directory:

```json
{
  "name": "Security Audit",
  "category": "security",
  "description": "Analyze code for vulnerabilities",
  "prompt": "You are a security expert. Analyze the following code..."
}
```

### Agent Properties

| Property      | Required | Description                                     |
| ------------- | -------- | ----------------------------------------------- |
| `name`        | Yes      | Display name of the agent                       |
| `category`    | Yes      | Category for grouping (e.g., security, quality) |
| `prompt`      | Yes      | The system prompt sent to the LLM               |
| `description` | No       | Brief description of what the agent does        |

## Supported File Types

- TypeScript (`.ts`, `.tsx`)
- JavaScript (`.js`, `.jsx`)
- Python (`.py`)
- Java (`.java`)
- Go (`.go`)
- Rust (`.rs`)
- Ruby (`.rb`)
- PHP (`.php`)
- C# (`.cs`)
- C/C++ (`.c`, `.cpp`)
- Swift (`.swift`)
- Kotlin (`.kt`)

## Ignored Paths

- `node_modules/`
- `dist/`, `build/`
- `.git/`
- `vendor/`
- `__pycache__/`
- `target/`
- `.next/`
- `coverage/`
- Minified/bundled files

## Configuration

`.kesmorc.json` structure:

```json
{
  "provider": "openai",
  "apiKey": "sk-...",
  "model": "gpt-4o"
}
```

## Project Structure

```
kesmo/
├── bin/kesmo.ts              # CLI entry point
├── src/
│   ├── commands/
│   │   ├── plugin.ts         # Plugin selection command
│   │   └── scan.ts           # Full scan command
│   ├── core/
│   │   ├── agents/
│   │   │   └── loader.ts     # Plugin loader
│   │   ├── scanner/
│   │   │   └── scanner.ts    # File scanner
│   │   ├── provider/
│   │   │   ├── index.ts      # Provider router
│   │   │   ├── openai.ts     # OpenAI adapter
│   │   │   ├── claude.ts     # Claude adapter
│   │   │   ├── openrouter.ts # OpenRouter adapter
│   │   │   └── gemini.ts     # Gemini adapter
│   │   ├── orchestrator/
│   │   │   └── run.ts        # Analysis orchestrator
│   │   ├── codeOptimizer.ts  # Code optimization
│   │   ├── promptOptimizer.ts # Prompt optimization
│   │   └── tokenLimiter.ts   # Token limit enforcement
│   ├── utils/
│   │   ├── config.ts         # Configuration management
│   │   ├── setup.ts          # Initial setup wizard
│   │   ├── chunk.ts          # Smart chunking
│   │   └── logger.ts         # Logging system
│   ├── types.ts              # TypeScript types
│   └── index.ts              # Module exports
├── prompts/                   # Agent definitions
├── logs/                      # Analysis logs
├── package.json
└── tsconfig.json
```

## API

You can also use KESMO programmatically:

```typescript
import { runLLM, scanFiles, loadPlugins, runAgent } from "kesmo";

// Run a custom analysis
const files = await scanFiles();
const plugins = loadPlugins();
const results = await runAgent(plugins[0], { verbose: true });
```

## License

ISC
