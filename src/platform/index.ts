import { MacOSContextProvider } from "./macos.js";
import { WindowsContextProvider } from "./windows.js";
import type { PlatformContextProvider } from "./types.js";

export function createPlatformContextProvider(
  platform: NodeJS.Platform = process.platform,
): PlatformContextProvider {
  if (platform === "darwin") {
    return new MacOSContextProvider();
  }

  if (platform === "win32") {
    return new WindowsContextProvider();
  }

  throw new Error(`Unsupported platform: ${platform}`);
}
