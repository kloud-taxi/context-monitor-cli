import axios from 'axios';

// 環境変数（.env）からAPIキーを読み込む
const API_KEY = process.env.SAKURA_AI_API_KEY;
// ※実際のエンドポイントとモデル名は、さくらAIの仕様書に合わせて書き換えてね！
const API_URL = "https://api.sakura.ad.jp/v1/chat/completions"; 

/**
 * 目的と現在の状況を比較して、サボっているか判定する関数
 */
export async function checkDistraction(objective: string, title: string, url: string) {
  
  // 1. AIへの指示（プロンプト）
  const systemPrompt = `
  あなたはユーザーが目標に集中しているか判定する厳しいAIです。
  ユーザーの目標: ${objective}
  現在のウィンドウ: ${title} (URL: ${url})
  
  集中から逸れている場合は true と叱咤メッセージを、関連しているか判断できない場合は誤爆を防ぐため false を、以下のJSON形式で厳密に返してください。
  {"is_distracted": boolean, "scolding_message": "string"}
  `;

  try {
    // 2. axiosを使ってさくらAIのサーバーに通信（POSTリクエスト）を送る
    const response = await axios.post(
      API_URL,
      {
        model: "llm-jp-3.1-8x13b-instruct4", // ※指定のモデル名に変更
        messages: [{ role: "system", content: systemPrompt }],
        response_format: { type: "json_object" } // 絶対にJSONで返せという命令
      },
      {
        headers: {
          "Authorization": `Bearer ${API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    // 3. サーバーから返ってきたAIの答えを取り出して、JSONとして解釈する
    const resultText = response.data.choices[0].message.content;
    const resultJson = JSON.parse(resultText);
    
    return resultJson;

  } catch (error) {
    // 通信エラーが起きた時の処理
    console.error("AI APIの呼び出しでエラーが起きたぞ！:", error);
    // エラーでCLIが落ちないように、とりあえず「セーフ（叱らない）」として返す
    return { is_distracted: false, scolding_message: "" };
  }
}