# 目的連動型コンテキストAI叱咤CLI (context-monitor-cli)

## 概要
作業の脱線をAIが検知し、容赦なく音声で叱ってくれる集中支援CLIツールです。
ユーザーが事前に設定した「目的」と、現在アクティブなウィンドウ（タイトル・URL）のコンテキストを比較し、関係ない作業をしていると判断された場合にAWS Pollyによる合成音声で叱咤激励します。

## アーキテクチャと使用技術
- **言語・環境**: Node.js / TypeScript
- **AI判定**: さくらインターネット AI API
- **音声合成 (TTS)**: AWS Polly
- **音声再生**: macOS標準 `afplay`
- **OS連携**: AppleScript (macOSのウィンドウ情報取得)

## 機能
- アクティブウィンドウのタイトルとURLを定期監視
- さくらAIによる、目的と現在の作業の関連性判定
- 判定結果に基づく、AIからの叱咤テキスト自動生成
- AWS Pollyを利用した高音質な叱咤ボイスの生成と即時再生

## 開発環境のセットアップ (Getting Started)

### 1. リポジトリのクローンとパッケージインストール
\`\`\`bash
git clone https://github.com/あなたのユーザー名/リポジトリ名.git
cd リポジトリ名
npm install
\`\`\`

### 2. 環境変数の設定
プロジェクトのルートディレクトリに `.env` ファイルを作成し、以下のAPIキーを設定してください。（※ `.env` はGitにコミットしないでください）
\`\`\`env
SAKURA_AI_API_KEY=your_sakura_api_key
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=ap-northeast-1
\`\`\`

### 3. ビルドと実行
\`\`\`bash
# TypeScriptのコンパイル
npx tsc

# CLIの起動
node dist/index.js
\`\`\`
*(※開発中は `npx ts-node src/index.ts` 等を使用)*
