import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

type MutableEnv = Record<string, string | undefined>;

type LoadLocalEnvOptions = {
  cwd?: string;
  env?: MutableEnv;
};

const stripWrappingQuotes = (value: string): string => {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
};

export const loadLocalEnv = (options: LoadLocalEnvOptions = {}): void => {
  const cwd = options.cwd ?? process.cwd();
  const env = options.env ?? (Bun.env as MutableEnv);
  const envPath = join(cwd, ".env.local");

  if (!existsSync(envPath)) {
    return;
  }

  const content = readFileSync(envPath, "utf8");

  for (const line of content.split(/\r?\n/)) {
    const trimmedLine = line.trim();

    if (trimmedLine === "" || trimmedLine.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmedLine.indexOf("=");

    if (separatorIndex <= 0) {
      continue;
    }

    const key = trimmedLine.slice(0, separatorIndex).trim();
    const rawValue = trimmedLine.slice(separatorIndex + 1).trim();

    if (!key || env[key] !== undefined) {
      continue;
    }

    env[key] = stripWrappingQuotes(rawValue);
  }
};
