import "dotenv/config";
import { checkDistraction } from "./ai.js";
import { generateScoldingVoice } from "./tts.js"; // 👈 tts.tsから関数をインポート！
import { createPlatformContextProvider } from "./platform/index.js";

async function main() {
  console.log("🚀 さくらAI 統合テスト（判定＋音声）を開始します...");

  const myGoal = "ハッカソンのためのTypeScriptの実装";
  const provider = createPlatformContextProvider();

  try {
    const currentContext = await provider.getCurrentContext();
    const currentTitle = [currentContext.appName, currentContext.windowTitle]
      .filter(Boolean)
      .join(" - ");

    console.log("🖥️ 現在のコンテキスト:", currentContext);
    console.log("📡 判定中...");
    const result = await checkDistraction(
      myGoal,
      currentTitle,
      currentContext.url,
    );

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
