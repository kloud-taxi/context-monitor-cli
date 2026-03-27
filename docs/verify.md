# Log verification 仕様

## 目的

- `history.log` の改ざん検出を行う
- ガウスの時計計算により記録の連続性を検証する

## 用語

- `m`: サーバー側で生成する検証用の数値
- `n`: 計算の法（初期値は 41）
- `d_i`: 数列 $d_i = m^i \bmod n$

## m の算出

- サーバー側で算出する
- サーバー時刻を `serverTimestamp` として採用する
- 入力は 1 レコード分の JSON と `serverTimestamp`
- ハッシュは `SHA-256( serverTimestamp + "\n" + canonicalJson )`
- ハッシュは 16 進を 10 進整数に変換し、その値を `m` とする

### canonicalJson

- `history.log` の 1 レコードから以下のフィールドのみを抜き出して JSON 文字列化する
  - `timestamp`
  - `objective`
  - `appName`
  - `windowTitle`
  - `url`
  - `isDistracted`
  - `scoldingMessage`
- キー順は上記の順序で固定する
- `scoldingMessage` が空の場合は空文字列

## 数列計算

- 初期値は `n = 41`
- $d_1 = m \bmod n$
- $d_i = (d_{i-1} \times m) \bmod n$ (i > 1)
- $d_8$ を当該レコードの検証値とする
- 次レコードの `n` は前レコードの $d_8$
- 次レコードの `m` はサーバー側で算出した新しい `m`

## history.log への保存

- 各行に以下を含める
  - `serverTimestamp`
  - `m` (10 進文字列)
  - `n` (当該レコード計算時に使った `n`)
  - `d8` (当該レコードの $d_8$)

## CLIの挙動

- 監視ループで新しいレコードを作成するたびにサーバーへ `m` を要求する
- `d_1..d_8` を計算し、`d8` をログに保存する
- 終了時に直近の `m` を標準出力へ出す

## 検証コマンド

- `cmc verify-log /path/to/file`
- 各レコードについて以下を検証する
  - サーバーが計算した `m` とログの `m` が一致する
  - 計算した `d8` とログの `d8` が一致する

## API (apps/calc)

### `POST /hash`

- Request

```json
{
  "record": {
    "timestamp": "...",
    "objective": "...",
    "appName": "...",
    "windowTitle": "...",
    "url": "...",
    "isDistracted": false,
    "scoldingMessage": "..."
  },
  "serverTimestamp": "2026-03-27T08:30:00.000Z"
}
```

- Response

```json
{
  "serverTimestamp": "2026-03-27T08:30:00.000Z",
  "m": "12345678901234567890"
}
```

## 設定

- `CONTEXT_MONITOR_CALC_URL`: 検証用サーバーのURL (例: `https://example.awsapprunner.com`)
