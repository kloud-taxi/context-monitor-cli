import { runCommand } from "./shell.js";
import type { MonitoredContext, PlatformContextProvider } from "./types.js";

const POWERSHELL_SCRIPT = `
Add-Type @"
using System;
using System.Runtime.InteropServices;
using System.Text;

public static class User32 {
  [DllImport("user32.dll")]
  public static extern IntPtr GetForegroundWindow();

  [DllImport("user32.dll", SetLastError=true)]
  public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint processId);

  [DllImport("user32.dll", SetLastError=true, CharSet=CharSet.Unicode)]
  public static extern int GetWindowText(IntPtr hWnd, StringBuilder text, int count);
}
"@

$hWnd = [User32]::GetForegroundWindow()
if ($hWnd -eq [IntPtr]::Zero) {
  $nl = [Environment]::NewLine
  Write-Output ($nl + $nl)
  exit 0
}

$processId = 0
[void][User32]::GetWindowThreadProcessId($hWnd, [ref]$processId)

$buffer = New-Object System.Text.StringBuilder 1024
[void][User32]::GetWindowText($hWnd, $buffer, $buffer.Capacity)

$processName = ""
try {
  $processName = (Get-Process -Id $processId -ErrorAction Stop).ProcessName
} catch {
  $processName = ""
}

$title = $buffer.ToString()
$nl = [Environment]::NewLine
Write-Output ($processName + $nl + $title + $nl)
`;

export class WindowsContextProvider implements PlatformContextProvider {
  async getCurrentContext(): Promise<MonitoredContext> {
    const raw = await runCommand("powershell", [
      "-NoProfile",
      "-ExecutionPolicy",
      "Bypass",
      "-Command",
      POWERSHELL_SCRIPT,
    ]);

    const [appName = "", windowTitle = ""] = raw.split("\n");

    return {
      appName,
      windowTitle,
      url: "",
    };
  }
}
