import { describe, expect, test } from "bun:test";
import { mkdtempSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { loadLocalEnv } from "../../../src/config/env";

describe("loadLocalEnv", () => {
  test("loads key value pairs from .env.local", () => {
    const cwd = mkdtempSync(join(tmpdir(), "character-chat-env-"));
    writeFileSync(
      join(cwd, ".env.local"),
      ["LLM_PROVIDER=glm", "GLM_MODEL=glm-4.5-flash"].join("\n"),
    );

    const env: Record<string, string | undefined> = {};
    loadLocalEnv({ cwd, env });

    expect(env.LLM_PROVIDER).toBe("glm");
    expect(env.GLM_MODEL).toBe("glm-4.5-flash");
  });

  test("does not override existing process values", () => {
    const cwd = mkdtempSync(join(tmpdir(), "character-chat-env-"));
    writeFileSync(join(cwd, ".env.local"), "LLM_PROVIDER=glm\n");

    const env: Record<string, string | undefined> = {
      LLM_PROVIDER: "bailian",
    };

    loadLocalEnv({ cwd, env });

    expect(env.LLM_PROVIDER).toBe("bailian");
  });
});
