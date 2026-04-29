import { describe, expect, test } from "bun:test";
import { parseChatCliOptions } from "../../../src/app/chat-cli-options";

describe("parseChatCliOptions", () => {
  test("defaults to zhuge liang when no agent flag is provided", () => {
    const options = parseChatCliOptions([]);
    expect(options.agentId).toBe("zhuge_liang");
    expect(options.debugEnabled).toBe(false);
    expect(options.debugFull).toBe(false);
  });

  test("supports selecting an agent with --agent", () => {
    const options = parseChatCliOptions(["--agent", "cao_cao"]);
    expect(options.agentId).toBe("cao_cao");
  });

  test("supports selecting an agent with -a", () => {
    const options = parseChatCliOptions(["-a", "cao_cao", "--debug"]);
    expect(options.agentId).toBe("cao_cao");
    expect(options.debugEnabled).toBe(true);
    expect(options.debugFull).toBe(false);
  });

  test("throws when the agent flag is provided without a value", () => {
    expect(() => parseChatCliOptions(["--agent"])).toThrow("Missing value for --agent");
  });
});
