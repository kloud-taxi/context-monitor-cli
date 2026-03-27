# Unit test 仕様

## 対象

- `isSafeContext(appTitle, url)`

## テストケース

1. セーフなアプリ名は true を返す
   - 入力: `appTitle = "Visual Studio Code"`, `url = ""`
   - 期待値: `true`

2. セーフなURLは true を返す
   - 入力: `appTitle = "Browser"`, `url = "https://github.com/kloud-taxi"`
   - 期待値: `true`

3. セーフでないコンテキストは false を返す
   - 入力: `appTitle = "YouTube"`, `url = "https://www.youtube.com/"`
   - 期待値: `false`
