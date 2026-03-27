#!/usr/bin/env node
import "dotenv/config";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import readline from "node:readline/promises";
import { fileURLToPath } from "node:url";
import { checkDistraction } from "./ai.js";
import { createPlatformContextProvider } from "./platform/index.js";
import { generateScoldingVoice } from "./tts.js";

const DEFAULT_INTERVAL_SEC = 30;

type CliConfig = {
  apiKey: string;
};

type HistoryEntry = {
  timestamp: string;
  objective: string;
  appName: string;
  windowTitle: string;
  url: string;
  isDistracted: boolean;
  scoldingMessage?: string;
  error?: string;
};

function getConfigPath(): string {
  return path.join(os.homedir(), ".cmc", "config.json");
}

function loadConfig(): CliConfig | null {
  const configPath = getConfigPath();
  if (!fs.existsSync(configPath)) {
    return null;
  }

  try {
    const raw = fs.readFileSync(configPath, "utf-8");
    return JSON.parse(raw) as CliConfig;
  } catch {
    return null;
  }
}

function saveConfig(config: CliConfig): void {
  const configPath = getConfigPath();
  fs.mkdirSync(path.dirname(configPath), { recursive: true });
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

function getHistoryPath(): string {
  return path.join(os.homedir(), ".cmc", "history.log");
}

function appendHistory(entry: HistoryEntry): void {
  const historyPath = getHistoryPath();
  fs.mkdirSync(path.dirname(historyPath), { recursive: true });
  fs.appendFileSync(historyPath, `${JSON.stringify(entry)}\n`);
}

async function promptInput(label: string, mask = false): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true,
  });

  try {
    if (!mask) {
      const answer = await rl.question(label);
      return answer.trim();
    }

    const answer = await rl.question(label, {
      signal: undefined,
    });
    return answer.trim();
  } finally {
    rl.close();
  }
}

async function resolveApiKey(): Promise<string> {
  const envKey = process.env.SAKURA_AI_API_KEY?.trim();
  if (envKey) {
    return envKey;
  }

  const config = loadConfig();
  if (config?.apiKey) {
    return config.apiKey;
  }

  const input = await promptInput("APIキーを入力してください: ");
  if (input) {
    saveConfig({ apiKey: input });
  }
  return input;
}

async function resolveObjective(args: string[]): Promise<string> {
  const provided = args
    .filter((arg) => !arg.startsWith("-"))
    .join(" ")
    .trim();
  if (provided) {
    return provided;
  }

  return await promptInput("取り組んでいるタスクの概要を入力してください: ");
}

function printHelp(): void {
  console.log(`Usage: cmc ["タスクの概要"] [options]

Options:
  -v, --version   バージョン表示
  -h, --help      ヘルプ表示
`);
}

function getVersion(): string {
  const __filename = fileURLToPath(import.meta.url);
  const packageJsonPath = path.resolve(
    path.dirname(__filename),
    "../package.json",
  );
  const raw = fs.readFileSync(packageJsonPath, "utf-8");
  const pkg = JSON.parse(raw) as { version?: string };
  return pkg.version ?? "0.0.0";
}

async function startMonitoring(objective: string): Promise<void> {
  const intervalSec = Number(
    process.env.CONTEXT_MONITOR_INTERVAL_SEC ?? DEFAULT_INTERVAL_SEC,
  );
  const provider = createPlatformContextProvider();
  let isRunning = false;

  const runOnce = async () => {
    if (isRunning) {
      return;
    }
    isRunning = true;
    try {
      const currentContext = await provider.getCurrentContext();
      const currentTitle = [currentContext.appName, currentContext.windowTitle]
        .filter(Boolean)
        .join(" - ");

      const result = await checkDistraction(
        objective,
        currentTitle,
        currentContext.url,
      );
      appendHistory({
        timestamp: new Date().toISOString(),
        objective,
        appName: currentContext.appName,
        windowTitle: currentContext.windowTitle,
        url: currentContext.url,
        isDistracted: result.is_distracted,
        scoldingMessage: result.is_distracted
          ? result.scolding_message
          : undefined,
      });
      if (result.is_distracted) {
        console.log("\n🔥 サボり検知！音声を生成します...");
        const audioPath = await generateScoldingVoice(result.scolding_message);
        console.log(`✨ 音声ファイル: ${audioPath}`);
      } else {
        console.log("\n✨ 集中しています。音声生成はスキップしました。");
      }
    } catch (error) {
      console.error("監視中にエラーが発生しました:", error);
      appendHistory({
        timestamp: new Date().toISOString(),
        objective,
        appName: "",
        windowTitle: "",
        url: "",
        isDistracted: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      isRunning = false;
    }
  };

  console.log(
    `監視を開始します。${intervalSec}秒ごとにチェックします。終了は Ctrl + C`,
  );
  await runOnce();
  setInterval(() => {
    void runOnce();
  }, intervalSec * 1000);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  if (args.includes("-h") || args.includes("--help")) {
    printHelp();
    return;
  }

  if (args.includes("-v") || args.includes("--version")) {
    console.log(getVersion());
    return;
  }

  const apiKey = await resolveApiKey();
  if (!apiKey) {
    console.error("APIキーが未設定です。終了します。");
    process.exit(1);
  }

  process.env.SAKURA_AI_API_KEY = apiKey;
  const objective = await resolveObjective(args);
  if (!objective) {
    console.error("タスクの概要が未入力です。終了します。");
    process.exit(1);
  }

  await startMonitoring(objective);
}

main().catch((error) => {
  console.error("起動時にエラーが発生しました:", error);
  process.exit(1);
});
