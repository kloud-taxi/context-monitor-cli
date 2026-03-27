import axios from "axios";
import fs from "fs";
import path from "path";
import { getApiClient } from "./lib/apiClient.js";

const TTS_PROVIDER = "sakura";

// docs/voicevox-models.csv に基づく利用可能モデル一覧
const AVAILABLE_TTS_MODELS = [
  "zundamon",
  "ankomon",
  "kasukabetsumugi",
  "meimeihimari",
  "shikokumetan",
  "tohokuitako",
  "tohokukiritan",
  "tohokuzunko",
] as const;

// 仕様モデルはコード上部で明示
const SAKURA_TTS_SPEC_VOICE = "normal";

// さくらのTTS APIを呼び出す関数(現在は不安定なのでGoogle版をメインにしている)
async function generateVoiceSakura(text: string): Promise<string> {
  const outputDir = path.resolve(process.cwd(), "assets");
  const outputPath = path.join(outputDir, "temp.wav");
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const voice = process.env.SAKURA_TTS_VOICE ?? SAKURA_TTS_SPEC_VOICE;

  const client = getApiClient() as SakuraSpeechClient;
  const audioBlob = await client.createSpeech({
    model: AVAILABLE_TTS_MODELS[0],
    input: text,
    voice,
    response_format: "wav",
  });

  const arrayBuffer = await audioBlob.arrayBuffer();
  fs.writeFileSync(outputPath, Buffer.from(arrayBuffer));
  return outputPath;
}

// Google仕様version（APIキー不要で安定しているので、今はこちらをメインで使う）
async function generateVoiceGoogle(text: string): Promise<string> {
  const outputDir = path.resolve(process.cwd(), "assets");
  const outputPath = path.join(outputDir, "temp.mp3");
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  // Google Translateの読み上げAPIを拝借（APIキー不要！）
  const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=ja&client=tw-ob`;

  const response = await axios.get(url, { responseType: "arraybuffer" });
  fs.writeFileSync(outputPath, Buffer.from(response.data));
  return outputPath;
}

// 外部（test.tsなど）から実際に呼ばれるメイン関数
export async function generateScoldingVoice(text: string): Promise<string> {
  try {
    if (TTS_PROVIDER === "sakura") {
      console.log("🔊 さくらAPIで音声を生成します");
      return await generateVoiceSakura(text);
    }

    console.log("🔊 Google TTSで音声を生成します");
    return await generateVoiceGoogle(text);
  } catch (error) {
    console.error("音声生成でエラー発生:", error);
    throw error;
  }
}

type SpeechRequest = {
  model: string;
  input: string;
  voice?: string;
  instructions?: string;
  response_format?: "wav" | "mp3" | "ogg" | "aac" | "flac";
  stream_format?: "sse" | "jsonl";
};

type SakuraSpeechClient = {
  createSpeech: (payload: SpeechRequest) => Promise<Blob>;
};
