// safelist.ts

// 叱咤を回避する（絶対に安全な）アプリケーション名のキーワードリスト
export const SAFE_APPS: string[] = [
  "Visual Studio Code",
  "Code",             // VSCodeの別名表記対策
  "Terminal",         // Macの標準ターミナル
  "iTerm2",           // macの人気ターミナル
  "Windows Terminal", // windowsのターミナル
  "Slack",
  "Discord",
  "Zoom"
];

// 叱咤を回避するURLのドメインやキーワードリスト
export const SAFE_URLS: string[] = [
  "github.com",
  "stackoverflow.com",
  "qiita.com",
  "zenn.dev",
  "google.com/search" // 検索自体はセーフとする場合
];

/**
 * 渡されたアプリ名やURLがセーフリストに含まれているか判定する関数
 * メインプロセスから呼び出され、ウィンドウのタイトルやURLをチェックするために使用される
 * @param appTitle - ウィンドウのタイトル
 * @param url - ウィンドウのURL（ブラウザの場合）
 * @returns セーフリストに含まれている場合はtrue、そうでない場合はfalse
 */
export function isSafeContext(appTitle: string, url: string): boolean {
  // 大文字・小文字の違いで判定ミスが起きないように、全部小文字にしてから比較する
  const lowerTitle = appTitle.toLowerCase();
  const lowerUrl = url.toLowerCase();

  // titleの中に SAFE_APPS のどれかの文字列が含まれているかチェック
  const isAppSafe = SAFE_APPS.some(safeApp => 
    lowerTitle.includes(safeApp.toLowerCase())
  );

  // urlの中に SAFE_URLS のどれかの文字列が含まれているかチェック
  const isUrlSafe = SAFE_URLS.some(safeUrl => 
    lowerUrl.includes(safeUrl.toLowerCase())
  );

  // どちらかがセーフなら true (叱らない) を返す
  return isAppSafe || isUrlSafe;
}