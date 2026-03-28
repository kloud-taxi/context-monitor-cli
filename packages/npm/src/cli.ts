#!/usr/bin/env node
import "dotenv/config";
import { execFile } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import readline from "node:readline/promises";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { checkDistraction } from "./ai.js";
import { createPlatformContextProvider } from "./platform/index.js";
import { generateScoldingVoice } from "./tts.js";

const DEFAULT_INTERVAL_SEC = 10;
const SCOLDING_ART = "(｀・ω・´)";
const DEFAULT_N = 41n;

const execFileAsync = promisify(execFile);

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
  serverTimestamp?: string;
  m?: string;
  n?: string;
  d8?: string;
  error?: string;
};

type BaseRecord = {
  timestamp: string;
  objective: string;
  appName: string;
  windowTitle: string;
  url: string;
  isDistracted: boolean;
  scoldingMessage: string;
};

type HashResponse = {
  serverTimestamp: string;
  m: string;
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

function getCalcUrl(): string {
  return process.env.CONTEXT_MONITOR_CALC_URL ?? "http://localhost:8080";
}

async function requestHash(
  record: BaseRecord,
  serverTimestamp?: string,
): Promise<HashResponse> {
  const response = await fetch(`${getCalcUrl()}/hash`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ record, serverTimestamp }),
  });

  if (!response.ok) {
    throw new Error(`hash request failed: ${response.status}`);
  }

  return (await response.json()) as HashResponse;
}

function computeD8(m: bigint, n: bigint): { d8: bigint; nUsed: bigint } {
  const nUsed = n > 1n ? n : DEFAULT_N;
  let d = m % nUsed;
  for (let i = 2; i <= 8; i += 1) {
    d = (d * m) % nUsed;
  }

  return { d8: d, nUsed };
}

function loadLastD8(): bigint {
  const historyPath = getHistoryPath();
  if (!fs.existsSync(historyPath)) {
    return DEFAULT_N;
  }

  const lines = fs.readFileSync(historyPath, "utf-8").trim().split("\n");
  for (let i = lines.length - 1; i >= 0; i -= 1) {
    const line = lines[i]?.trim();
    if (!line) {
      continue;
    }
    try {
      const entry = JSON.parse(line) as { d8?: string };
      if (entry.d8) {
        return BigInt(entry.d8);
      }
    } catch {
      // ignore malformed line
    }
  }

  return DEFAULT_N;
}

async function verifyLog(filePath: string): Promise<void> {
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n").filter((line) => line.trim().length > 0);
  let currentN = DEFAULT_N;
  let ok = 0;
  let ng = 0;

  for (const line of lines) {
    try {
      const entry = JSON.parse(line) as HistoryEntry;
      if (!entry.serverTimestamp || !entry.m || !entry.d8) {
        throw new Error("missing proof fields");
      }

      const record: BaseRecord = {
        timestamp: entry.timestamp,
        objective: entry.objective,
        appName: entry.appName,
        windowTitle: entry.windowTitle,
        url: entry.url,
        isDistracted: entry.isDistracted,
        scoldingMessage: entry.scoldingMessage ?? "",
      };

      const recomputed = await requestHash(record, entry.serverTimestamp);
      const mMatches = recomputed.m === entry.m;
      const { d8, nUsed } = computeD8(BigInt(entry.m), currentN);
      const d8Matches = d8.toString() === entry.d8;
      const nMatches = entry.n ? entry.n === nUsed.toString() : true;

      if (!mMatches || !d8Matches || !nMatches) {
        throw new Error("verification failed");
      }

      currentN = d8;
      ok += 1;
    } catch (error) {
      console.error(
        "検証失敗:",
        error instanceof Error ? error.message : error,
      );
      ng += 1;
    }
  }

  console.log(`検証結果 OK=${ok} NG=${ng}`);
}

async function playAudio(filePath: string): Promise<void> {
  if (process.platform === "darwin") {
    await execFileAsync("afplay", [filePath]);
    return;
  }

  if (process.platform === "win32") {
    const command = `(New-Object Media.SoundPlayer '${filePath.replace(/'/g, "''")}').PlaySync()`;
    await execFileAsync("powershell", ["-NoProfile", "-Command", command]);
    return;
  }

  console.log("音声再生はこのOSでは未対応です。");
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
  let currentN = loadLastD8();
  let lastM: string | null = null;

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
      const record: BaseRecord = {
        timestamp: new Date().toISOString(),
        objective,
        appName: currentContext.appName,
        windowTitle: currentContext.windowTitle,
        url: currentContext.url,
        isDistracted: result.is_distracted,
        scoldingMessage: result.is_distracted ? result.scolding_message : "",
      };
      const hash = await requestHash(record);
      const { d8, nUsed } = computeD8(BigInt(hash.m), currentN);
      currentN = d8;
      lastM = hash.m;
      appendHistory({
        ...record,
        serverTimestamp: hash.serverTimestamp,
        m: hash.m,
        n: nUsed.toString(),
        d8: d8.toString(),
      });
      if (result.is_distracted) {
        console.log("\n🔥 サボり検知！音声を生成します...");
        console.log(SCOLDING_ART);
        const audioPath = await generateScoldingVoice(result.scolding_message);
        console.log(`✨ 音声ファイル: ${audioPath}`);
        await playAudio(audioPath);
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

  process.on("SIGINT", () => {
    if (lastM) {
      console.log(`\n最終m: ${lastM}`);
    }
    process.exit(0);
  });
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

  if (args[0] === "verify-log") {
    const targetPath = args[1];
    if (!targetPath) {
      console.error("検証対象ファイルを指定してください。");
      process.exit(1);
    }

    await verifyLog(targetPath);
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

  console.log(SCOLDING_ART);
  await startMonitoring(objective);
}

main().catch((error) => {
  console.error("起動時にエラーが発生しました:", error);
  process.exit(1);
});
