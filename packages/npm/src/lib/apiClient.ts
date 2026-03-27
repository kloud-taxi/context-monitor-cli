import { createClient } from "@kloud-taxi/api-client";

export function getApiClient() {
  const apiKey = process.env.SAKURA_AI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error(
      "SAKURA_AI_API_KEY が未設定です。環境変数を設定してください。",
    );
  }

  return createClient({ apiKey });
}
