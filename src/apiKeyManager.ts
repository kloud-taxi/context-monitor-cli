import fs from 'fs';
import path from 'path';
import os from 'os';

const CONFIG_DIR = path.join(os.homedir(), '.cmc');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

interface Config {
  apiKey: string;
}

export async function getApiKey(): Promise<string | null> {
  try {
    if (!fs.existsSync(CONFIG_FILE)) {
      return null;
    }
    const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8')) as Config;
    return config.apiKey || null;
  } catch (error) {
    return null;
  }
}

export async function saveApiKey(apiKey: string): Promise<void> {
  // ディレクトリがなければ作成
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }

  const config: Config = { apiKey };
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
}

export async function getConfigPath(): Promise<string> {
  return CONFIG_FILE;
}
