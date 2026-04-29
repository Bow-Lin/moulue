import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const RUNTIME_DIR = join(process.cwd(), ".runtime");
const DEV_SERVER_FILE = join(RUNTIME_DIR, "dev-server.json");

type DevServerRuntime = {
  port: number;
};

const ensureRuntimeDir = (): void => {
  if (!existsSync(RUNTIME_DIR)) {
    mkdirSync(RUNTIME_DIR, { recursive: true });
  }
};

export const writeDevServerRuntime = (runtime: DevServerRuntime): void => {
  ensureRuntimeDir();
  writeFileSync(DEV_SERVER_FILE, JSON.stringify(runtime, null, 2));
};

export const readDevServerRuntime = (): DevServerRuntime | null => {
  if (!existsSync(DEV_SERVER_FILE)) {
    return null;
  }

  const raw = readFileSync(DEV_SERVER_FILE, "utf8");
  const parsed = JSON.parse(raw) as Partial<DevServerRuntime>;

  if (typeof parsed.port !== "number" || !Number.isFinite(parsed.port)) {
    return null;
  }

  return {
    port: parsed.port,
  };
};
