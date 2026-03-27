#!/usr/bin/env node

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import inquirer from 'inquirer';
import { getApiKey, saveApiKey } from './apiKeyManager.js';
import { createPlatformContextProvider } from './platform/index.js';
import { checkDistraction } from './ai.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const packageJson = JSON.parse(
  readFileSync(join(__dirname, '..', 'package.json'), 'utf-8')
);

const VERSION = packageJson.version;
const args = process.argv.slice(2);

async function main() {
  // バージョン表示
  if (args.includes('-v') || args.includes('--version')) {
    console.log(`cmc version ${VERSION}`);
    process.exit(0);
  }

  // ヘルプ表示
  if (args.includes('-h') || args.includes('--help')) {
    console.log(`
Context Monitor CLI (cmc)

Usage:
  cmc [domain]     Start the context monitor with optional domain
  cmc -v, --version Show version
  cmc -h, --help    Show help

Example:
  cmc "Python development"
  cmc  # Will prompt for domain
`);
    process.exit(0);
  }

  // APIキーを確認
  let apiKey = await getApiKey();

  if (!apiKey) {
    console.log('APIキーが見つかりません。初回セットアップを実行します。\n');

    const answers = await inquirer.prompt([
      {
        type: 'password',
        name: 'apiKey',
        message: 'APIキーを入力してください:',
        validate: (input: string) => {
          if (!input.trim()) {
            return 'APIキーを入力してください';
          }
          return true;
        },
      },
    ]);

    apiKey = answers.apiKey as string;
    await saveApiKey(apiKey);
    console.log('APIキーを保存しました\n');
  }

  // 環境変数にAPIキーを設定
  process.env.SAKURA_AI_API_KEY = apiKey;

  // ドメインを取得
  let domain = args[0];

  if (!domain) {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'domain',
        message: '対象ドメインを入力してください (例: Python開発, ブログ執筆):',
        validate: (input: string) => {
          if (!input.trim()) {
            return 'ドメインを入力してください';
          }
          return true;
        },
      },
    ]);
    domain = answers.domain;
  }

  try {
    // 現在のウィンドウコンテキストを取得
    console.log('\n現在のウィンドウ情報を取得中...');
    const platformProvider = createPlatformContextProvider();
    const context = await platformProvider.getCurrentContext();

    console.log(`\nドメイン: ${domain}`);
    console.log(`アプリ: ${context.appName}`);
    console.log(`ウィンドウ: ${context.windowTitle}`);
    if (context.url) {
      console.log(`URL: ${context.url}`);
    }

    // AIで判定
    console.log('\nAI判定を実行中...');
    const result = await checkDistraction(
      domain,
      context.windowTitle,
      context.url
    );

    // 結果を表示
    console.log('\n=== 判定結果 ===');
    if (result.is_distracted) {
      console.log('⚠️  警告: 現在の作業が指定したドメインと無関係です！');
      console.log(`メッセージ: ${result.scolding_message}`);
      process.exit(1);
    } else {
      console.log('✅ 関連あり: 現在の作業は指定したドメインと関連しています。');
    }
  } catch (error) {
    console.error('エラーが発生しました:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('エラーが発生しました:', error.message);
  process.exit(1);
});
