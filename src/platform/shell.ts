import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

type RunCommandOptions = {
  timeoutMs?: number;
};

export async function runCommand(
  command: string,
  args: string[],
  options: RunCommandOptions = {},
): Promise<string> {
  const { stdout } = await execFileAsync(command, args, {
    timeout: options.timeoutMs ?? 5000,
    maxBuffer: 1024 * 1024,
    windowsHide: true,
  });

  return stdout.trim();
}
