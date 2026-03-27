# `context-monitor-cli`

## 概要

現在の作業が与えられたドメインに対して関連がある作業か評価し、そうでない場合には、警告を発出します。

## API仕様

- API仕様は[openapi.json](./openapi.json)にあります。
- 利用可能な音声モデルは[voicevox-models.csv](voicevox-models.csv)にあります。
- APIクライアントの使い方は[api-client.md](./api-client.md)にあります。
- 実装予定/実装済みのCLIコマンド一覧は[command.md](./command.md)にあります。

## 与えるコンテキスト

- 開いているウィンドウの一覧
  - 名前
  - ブラウザである場合には、タブとURL
- 取り組んでいるドメイン

## OS対応方針（Windows / Mac）

`src/platform` 配下にOS依存処理を分離し、共通インターフェース経由で取得します。

- `PlatformContextProvider`: OS差分を吸収する抽象インターフェース
- `MacOSContextProvider`: `osascript` で前面アプリと（Safari/Chrome時の）URLを取得
- `WindowsContextProvider`: `powershell` + Win32 API で前面ウィンドウ情報を取得

この構成により、判定ロジック（AI/TTS）はOS非依存のまま利用できます。

### macOSでのURL取得について

ブラウザURL取得は AppleScript の権限制約で待ちが発生する場合があるため、タイムアウトつきで取得を試行します。

- デフォルトでSafari/ChromeのURL取得を試行します。
- 無効化したい場合は `CONTEXT_MONITOR_FETCH_BROWSER_URL=0` を設定してください。
- 取得に失敗しても処理は継続し、`url` は空文字になります。

## CLIとしての利用

### インストール

npm からグローバルにインストールします。

```bash
npm i -g @kloud-taxi/cmc
```

### 起動

```bash
cmc
```

- 初回は APIキーの入力ガイドが表示されます。
- APIキーは `~/.cmc/config.json` に保存されます。
- 監視を終了するには `Ctrl + C` を入力します。
- サボり検知時は小さなASCIIアートを表示し、音声を自動再生します。

#### タスク概要を省略せずに起動

```bash
cmc "タスクの概要"
```

### バージョン/ヘルプ

```bash
cmc -v
cmc -h
```

## 開発とローカル実行

```bash
cd packages/npm
npm install
npm run dev
```

ビルドして実行する場合は以下です。

```bash
npm run build
npm run start
```

## 環境変数

- `SAKURA_AI_API_KEY`: 必須。APIキー。
- `CONTEXT_MONITOR_INTERVAL_SEC`: 任意。監視間隔（秒）。未指定時は `30`。
- `CONTEXT_MONITOR_FETCH_BROWSER_URL`: 任意。`0` のときURL取得を無効化します。

## npmパッケージとしての公開

```bash
cd packages/npm
npm login
npm publish --access public
```
