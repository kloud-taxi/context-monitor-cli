import 'dotenv/config';
import { checkDistraction } from './ai';
import { generateScoldingVoice } from './tts'; // 👈 tts.tsから関数をインポート！

async function main() {
  console.log("🚀 さくらAI 統合テスト（判定＋音声）を開始します...");

  const myGoal = "ハッカソンのためのTypeScriptの実装";
  const currentApp = "YouTube - 【作業用BGM】ひたすら癒やされる猫動画";
  const currentUrl = "https://www.youtube.com/watch?v=xxxxxx";

  try {
    console.log("📡 判定中...");
    const result = await checkDistraction(myGoal, currentApp, currentUrl);

    console.log("\n✅ AI判定結果:", JSON.stringify(result, null, 2));

    // 💡 ここに挿入！「サボり」判定だったら声を出す
    if (result.is_distracted) {
      console.log("\n🔥 サボり検知！音声を生成します...");
      
      // tts.ts の関数を呼び出す
      const audioPath = await generateScoldingVoice(result.scolding_message);
      
      console.log(`\n✨ 音声ファイルが完成したぞ！: ${audioPath}`);
      console.log("👉 フォルダにある 'assets/temp.mp3' を開いて聴いてみて！");
    } else {
      console.log("\n✨ 集中しています。音声生成はスキップしたよ。");
    }

  } catch (error) {
    console.error("❌ 統合テスト中にエラー:", error);
  }
}

main();