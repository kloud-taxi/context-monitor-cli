# History log 仕様

`.cmc/history.log` に 1 行 1 レコードの JSON Lines 形式で記録します。

## 目的

- 監視結果を時系列で追跡できるようにする
- 監視中のアプリ/ウィンドウや判定結果を後から確認できるようにする

## 形式

- 1 行 1 JSON
- UTF-8
- 追記方式（append only）

## ログファイル

- パス: `~/.cmc/history.log`

## フィールド

- `timestamp`: ISO 8601 形式の日時（例: `2026-03-27T08:12:34.567Z`）
- `objective`: 取り組んでいるタスク概要
- `appName`: 前面アプリ名
- `windowTitle`: 前面ウィンドウのタイトル
- `url`: ブラウザ URL（取得できない場合は空文字）
- `isDistracted`: サボり判定（`true`/`false`）
- `scoldingMessage`: 叱咤メッセージ（`isDistracted` が `true` の場合に入る）
- `serverTimestamp`: サーバー時刻（ISO 8601）
- `m`: サーバー計算で生成された数値（10進文字列）
- `n`: 計算時に使った `n`（10進文字列）
- `d8`: $d_8$ の値（10進文字列）
- `error`: エラーが発生した場合の簡易メッセージ

## 例

```json
{
  "timestamp": "2026-03-27T08:12:34.567Z",
  "objective": "TypeScriptの実装",
  "appName": "Google Chrome",
  "windowTitle": "GitHub - kloud-taxi/context-monitor-cli",
  "url": "https://github.com/kloud-taxi/context-monitor-cli",
  "isDistracted": false
}
```

```json
{
  "timestamp": "2026-03-27T08:13:04.567Z",
  "objective": "TypeScriptの実装",
  "appName": "YouTube",
  "windowTitle": "おすすめ - YouTube",
  "url": "https://www.youtube.com/",
  "isDistracted": true,
  "scoldingMessage": "作業に戻れ"
}
```

```json
{
  "timestamp": "2026-03-27T08:13:34.567Z",
  "objective": "TypeScriptの実装",
  "appName": "",
  "windowTitle": "",
  "url": "",
  "isDistracted": false,
  "error": "Failed to fetch context"
}
```
