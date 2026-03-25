import axios from 'axios';
import fs from 'fs';
import path from 'path';

const API_KEY = process.env.SAKURA_AI_API_KEY;
const TTS_URL = "https://api.ai.sakura.ad.jp/v1/audio/speech";

// さくらのTTS APIを呼び出す関数(現在は不安定なのでGoogle版をメインにしている)
async function generateVoiceSakura(text: string): Promise<string> {
  const outputDir = path.resolve(process.cwd(), "assets");
  const outputPath = path.join(outputDir, "temp.mp3");
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

  const response = await axios.post(
    TTS_URL,
    {
      model: "tts-1", // 👈 いつか正しい名前が判明したら書き換える！
      input: text,
      voice: "alloy",
    },
    {
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      responseType: 'arraybuffer'
    }
  );
  fs.writeFileSync(outputPath, Buffer.from(response.data));
  return outputPath;
}

// Google仕様version（APIキー不要で安定しているので、今はこちらをメインで使う）
async function generateVoiceGoogle(text: string): Promise<string> {
  const outputDir = path.resolve(process.cwd(), "assets");
  const outputPath = path.join(outputDir, "temp.mp3");
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

  // Google Translateの読み上げAPIを拝借（APIキー不要！）
  const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=ja&client=tw-ob`;

  const response = await axios.get(url, { responseType: 'arraybuffer' });
  fs.writeFileSync(outputPath, Buffer.from(response.data));
  return outputPath;
}

// 外部（test.tsなど）から実際に呼ばれるメイン関数
export async function generateScoldingVoice(text: string): Promise<string> {
  try {
    // 💡 今はGoogle版をリターンする。さくらが直ったら下をコメントアウト解除するだけ！
    console.log("🔊 安定のGoogle先生で音声を生成するぞ！");
    return await generateVoiceGoogle(text);
    
    // return await generateVoiceSakura(text);
  } catch (error) {
    console.error("音声生成でエラー発生:", error);
    throw error;
  }
}