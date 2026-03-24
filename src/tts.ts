import axios from 'axios';
import fs from 'fs';
import path from 'path';

const API_KEY = process.env.SAKURA_AI_API_KEY;
const TTS_URL = "https://api.ai.sakura.ad.jp/v1/audio/speech"; // ※さくらAIの音声合成用URLを確認してね

/**
 * さくらAIを使って、叱咤テキストをmp3に変換する
 */
export async function generateScoldingVoice(text: string): Promise<string> {
  const outputDir = path.resolve(process.cwd(), "assets");
  const outputPath = path.join(outputDir, "temp.mp3");

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }

  try {
    const response = await axios.post(
      TTS_URL,
      {
        model: "zundamon", // さくら側が提供しているTTSモデル名
        input: text,
        voice: "shimmer", // 声の種類（alloy, echo, fable, onyx, nova, shimmerなど）
      },
      {
        headers: {
          "Authorization": `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
        },
        responseType: 'arraybuffer' // 音声バイナリデータとして受け取る設定
      }
    );

    // 受け取ったバイナリをファイルに保存
    fs.writeFileSync(outputPath, Buffer.from(response.data));
    
    console.log(`🌸 さくらAIで音声生成完了: ${outputPath}`);
    return outputPath;

  } catch (error) {
    console.error("さくらAI TTSでエラー発生:", error);
    throw error;
  }
  
}