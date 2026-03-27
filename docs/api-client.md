# Sakura AI Platform SDK (npm)

さくらのAIプラットフォーム向けのnpm SDKです。Chat/音声/埋め込み/音声合成/文字起こしのAPIを簡単に呼び出せます。

## インストール

GitHub Packages から配布しています。利用側プロジェクトの `.npmrc` に設定してからインストールしてください。

```ini
@kloud-taxi:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
always-auth=true
```

```bash
npm install @kloud-taxi/api-client
```

### 動作要件

- Node.js 18 以上（`fetch` が利用可能）
- それ以前のNode.jsで利用する場合は `fetch` 実装を渡してください

## 使い方

### クライアント作成

```ts
import { createClient } from "@kloud-taxi/api-client";

const client = createClient({
  apiKey: process.env.SAKURA_API_KEY ?? "",
});
```

### Chat Completions

```ts
import { createClient } from "@kloud-taxi/api-client";

const client = createClient({ apiKey: process.env.SAKURA_API_KEY ?? "" });

const response = await client.createChatCompletion({
  model: "sakura-chat-1",
  messages: [
    { role: "system", content: "あなたは親切なアシスタントです。" },
    { role: "user", content: "こんにちは" },
  ],
  temperature: 0.7,
});

console.log(response);
```

### 文字起こし（Transcription）

```ts
import { createClient } from "@kloud-taxi/api-client";

const client = createClient({ apiKey: process.env.SAKURA_API_KEY ?? "" });

const audioFile = new File(
  [await fetch("/sample.wav").then((r) => r.arrayBuffer())],
  "sample.wav",
);

const transcription = await client.createTranscription({
  file: audioFile,
  model: "whisper-large-v3-turbo",
  language: "ja",
});

console.log(transcription.text);
```

### 埋め込み（Embeddings）

```ts
import { createClient } from "@kloud-taxi/api-client";

const client = createClient({ apiKey: process.env.SAKURA_API_KEY ?? "" });

const embeddings = await client.createEmbeddings({
  model: "sakura-embedding-1",
  input: "こんにちは",
});

console.log(embeddings.data[0]?.embedding);
```

### 音声合成（Speech）

```ts
import { createClient } from "@kloud-taxi/api-client";

const client = createClient({ apiKey: process.env.SAKURA_API_KEY ?? "" });

const audioBlob = await client.createSpeech({
  model: "sakura-tts-1",
  input: "こんにちは。",
  voice: "default",
  response_format: "mp3",
});

console.log(audioBlob.size);
```

### TTS（Audio Query + Synthesis）

```ts
import { createClient } from "@kloud-taxi/api-client";

const client = createClient({ apiKey: process.env.SAKURA_API_KEY ?? "" });

const query = await client.createTtsAudioQuery({
  text: "こんにちは。",
  speaker: 1,
});

const speech = await client.synthesizeTtsSpeech({ speaker: 1 }, query);

console.log(speech.size);
```

## エラーハンドリング

APIエラーは `SakuraApiError` が投げられます。`status` と `data` を参照できます。

```ts
import { SakuraApiError, createClient } from "@kloud-taxi/api-client";

const client = createClient({ apiKey: process.env.SAKURA_API_KEY ?? "" });

try {
  await client.createChatCompletion({
    model: "sakura-chat-1",
    messages: [{ role: "user", content: "こんにちは" }],
  });
} catch (error) {
  if (error instanceof SakuraApiError) {
    console.error(error.status, error.data);
  }
}
```

## API

主要なメソッドは以下です。

- `createChatCompletion(payload)`
- `createTranscription(payload)`
- `createEmbeddings(payload)` / `createEmbedding(payload)`
- `createSpeech(payload)`
- `createTtsAudioQuery(params)`
- `synthesizeTtsSpeech(params, payload)`

型定義はパッケージに同梱されています。詳細は TypeScript の型情報を参照してください。
