# `context-monitor-cli`

## 概要

現在の作業が与えられたドメインに対して関連がある作業か評価し、そうでない場合には、警告を発出します。

## API仕様

- API仕様は[openapi.json](./openapi.json)にあります。
- 利用可能な音声モデルは[voicevox-models.csv](voicevox-models.csv)にあります。

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

ブラウザURL取得は AppleScript の権限制約で待ちが発生する場合があるため、デフォルトでは無効です。

- `CONTEXT_MONITOR_FETCH_BROWSER_URL=1` を設定したときだけ、Safari/ChromeのURL取得を試行します。
- 取得に失敗しても処理は継続し、`url` は空文字になります。

# 仕様
- `npm i -g @kloud-taxi/cmc`
- `cmc`: アプリの起動。初回だけAPIキーを入力させてローカルに保存
- `cmc -v`: バージョンの管理

# コマンド
- cmc "Python開発"          # ドメインを指定して実行
- cmc                       # プロンプトでドメイン入力
- cmc -h                    # ヘルプ表示
- cmc -v                    # バージョン表示
