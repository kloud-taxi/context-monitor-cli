import axios from 'axios';

const API_KEY = process.env.SAKURA_AI_API_KEY;
const API_URL = "https://api.ai.sakura.ad.jp/v1/chat/completions"; 

export async function checkDistraction(objective: string, title: string, url: string) {
  // 1. プロンプトを極限までシンプルかつ厳格に
  const systemPrompt = `
目標: ${objective}
現在の状況: ${title} (URL: ${url})

あなたは監視AIです。現在の状況が目標と無関係なら true、関係あるなら false。
必ず以下のJSON形式のみで返し、前置きや解説は一切禁止します。
{"is_distracted": boolean, "scolding_message": "厳しい叱咤"}
  `;

  try {
    const response = await axios.post(
      API_URL,
      {
        model: "llm-jp-3.1-8x13b-instruct4",
        messages: [{ role: "user", content: systemPrompt }], // userロールの方が言う事を聞きやすい
        max_tokens: 150,
        temperature: 0.1, // 値を下げて「遊び」をなくし、正確性を上げる
        response_format: { type: "json_object" }
      },
      {
        headers: {
          "Authorization": `Bearer ${API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const resultText = response.data.choices[0].message.content;
    
    // 【重要】正規表現でJSON部分だけを抜き出す（これで「ア」とかの余計な文字を無視！）
    const jsonMatch = resultText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
        throw new Error("AIが有効なJSONを返さなかったぞ！");
    }
    
    return JSON.parse(jsonMatch[0]);

  } catch (error) {
    console.error("AI APIの呼び出しでエラー:", error);
    return { is_distracted: false, scolding_message: "" };
  }
}