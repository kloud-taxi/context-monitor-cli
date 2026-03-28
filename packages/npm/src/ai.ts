import { isSafeContext } from "./safelist.js";
import { getApiClient } from "./lib/apiClient.js";

export async function checkDistraction(
  objective: string,
  title: string,
  url: string,
) {
  if (isSafeContext(title, url)) {
    return { is_distracted: false, scolding_message: "" };
  }

  // プロンプトを極限までシンプルかつ厳格に
  const systemPrompt = `
目標: ${objective}
現在の状況: ${title} (URL: ${url})

あなたは監視AIです。
- is_distracted: 現在の状況が目標と無関係なら true、関係あるなら false。
- scolding_message: 「勉強してください。それとも「お説教」を聞きたいですか？」など

を返答してください。
必ず以下のJSON形式のみで返し、前置きや解説は一切禁止します。

{"is_distracted": boolean, "scolding_message": "(短い叱咤の文章)"}

- is_distracted: 現在の状況が目標と無関係なら true、関係あるなら false。
- scolding_message: 「勉強してください。それとも「お説教」を聞きたいですか？」など
  `;

  try {
    const client = getApiClient() as ChatCompletionClient;
    const payload: ChatCompletionRequest = {
      model: "gpt-oss-120b",
      messages: [{ role: "user", content: systemPrompt }], // userロールの方が言う事を聞きやすい
      max_tokens: 150,
      temperature: 0.1,
      response_format: { type: "json_object" },
    };

    const response = await client.createChatCompletion(payload);

    const resultText = normalizeMessageContent(
      response.choices?.[0]?.message?.content ?? "",
    );

    return parseResult(resultText);
  } catch (error) {
    console.error("AI APIの呼び出しでエラー:", error);
    return { is_distracted: false, scolding_message: "" };
  }
}

type MessageContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string; detail?: string } };

type ChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string | MessageContentPart[];
    };
  }>;
};

type ChatCompletionRequest = {
  model: string;
  messages: Array<{ role: "user"; content: string }>;
  max_tokens?: number;
  temperature?: number;
  response_format?: { type: "json_object" };
};

type ChatCompletionClient = {
  createChatCompletion: (
    payload: ChatCompletionRequest,
  ) => Promise<ChatCompletionResponse>;
};

function normalizeMessageContent(
  content: string | MessageContentPart[],
): string {
  if (typeof content === "string") {
    return content;
  }

  return content
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("");
}

type DistractionResult = {
  is_distracted: boolean;
  scolding_message: string;
};

function parseResult(resultText: string): DistractionResult {
  const trimmed = resultText.trim();
  if (!trimmed) {
    throw new Error("AIの応答が空です。");
  }

  const direct = safeParse(trimmed);
  if (direct) {
    return normalizeResult(direct);
  }

  const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("AIが有効なJSONを返しませんでした。");
  }

  const fallback = safeParse(jsonMatch[0]);
  if (!fallback) {
    throw new Error("AIのJSONが解析できませんでした。");
  }

  return normalizeResult(fallback);
}

function safeParse(text: string): unknown | null {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function normalizeResult(parsed: unknown): DistractionResult {
  if (!parsed || typeof parsed !== "object") {
    throw new Error("AIのJSON形式が不正です。");
  }

  const raw = parsed as { is_distracted?: unknown; scolding_message?: unknown };
  const isDistracted =
    typeof raw.is_distracted === "boolean"
      ? raw.is_distracted
      : typeof raw.is_distracted === "string"
        ? raw.is_distracted.toLowerCase() === "true"
        : false;
  const scoldingMessage =
    typeof raw.scolding_message === "string" ? raw.scolding_message : "";

  return { is_distracted: isDistracted, scolding_message: scoldingMessage };
}
