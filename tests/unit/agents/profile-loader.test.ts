import { describe, expect, test } from "bun:test";
import { loadProfile } from "../../../src/agents/profiles/loader";

describe("loadProfile", () => {
  test("loads zhuge liang profile", async () => {
    const profile = await loadProfile("zhuge_liang");
    expect(profile.agentId).toBe("zhuge_liang");
    expect(profile.name).toBe("Zhuge Liang");
    expect(profile.faction).toBe("Shu");
  });
});
