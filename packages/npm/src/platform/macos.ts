import { runCommand } from "./shell.js";
import type { MonitoredContext, PlatformContextProvider } from "./types.js";

const FRONT_APP_SCRIPT =
  'tell application "System Events" to name of first application process whose frontmost is true';

const WINDOW_TITLE_SCRIPT = String.raw`
tell application "System Events"
  set frontApp to name of first application process whose frontmost is true
  tell process frontApp
    try
      return name of front window
    on error
      return ""
    end try
  end tell
end tell
`;

const CHROME_URL_SCRIPT = String.raw`
tell application "Google Chrome"
  if (count of windows) > 0 then
    return URL of active tab of front window
  end if
end tell
return ""
`;

const SAFARI_URL_SCRIPT = String.raw`
tell application "Safari"
  if (count of windows) > 0 then
    return URL of front document
  end if
end tell
return ""
`;

function shouldFetchBrowserUrl(): boolean {
  return process.env.CONTEXT_MONITOR_FETCH_BROWSER_URL !== "0";
}

export class MacOSContextProvider implements PlatformContextProvider {
  async getCurrentContext(): Promise<MonitoredContext> {
    let appName = "";
    let windowTitle = "";
    let url = "";

    try {
      appName = await runCommand("osascript", ["-e", FRONT_APP_SCRIPT], {
        timeoutMs: 5000,
      });
      windowTitle = await runCommand("osascript", ["-e", WINDOW_TITLE_SCRIPT], {
        timeoutMs: 5000,
      });

      if (shouldFetchBrowserUrl()) {
        if (appName === "Google Chrome") {
          url = await runCommand("osascript", ["-e", CHROME_URL_SCRIPT], {
            timeoutMs: 1500,
          });
        } else if (appName === "Safari") {
          url = await runCommand("osascript", ["-e", SAFARI_URL_SCRIPT], {
            timeoutMs: 1500,
          });
        }
      }
    } catch {
      return { appName: "", windowTitle: "", url: "" };
    }

    return {
      appName,
      windowTitle,
      url,
    };
  }
}
