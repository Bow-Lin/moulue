import { describe, expect, test } from "bun:test";
import { loadProfile } from "../../../src/agents/profiles/loader";

describe("loadProfile", () => {
  test("loads zhuge liang profile", async () => {
    const profile = await loadProfile("zhuge_liang");
    expect(profile.agentId).toBe("zhuge_liang");
    expect(profile.name).toBe("Zhuge Liang");
    expect(profile.faction).toBe("Shu");
    expect(profile.schemaVersion).toBe(1);
    expect(profile.type).toBe("historical_character");
    expect(profile.identity.title.length).toBeGreaterThan(0);
    expect(profile.decisionPolicy.defaultStrategy.length).toBeGreaterThan(0);
  });

  test("loads cao cao profile through the convention-based loader", async () => {
    const profile = await loadProfile("cao_cao");
    expect(profile.agentId).toBe("cao_cao");
    expect(profile.name).toBe("Cao Cao");
    expect(profile.faction).toBe("Wei");
    expect(profile.schemaVersion).toBe(1);
    expect(profile.relationships.liu_bei?.length).toBeGreaterThan(0);
  });

  test("rejects invalid agent ids before attempting file access", async () => {
    await expect(loadProfile("../cao_cao")).rejects.toThrow("Invalid agent profile id");
  });

  test("returns a clear error for unknown agent profiles", async () => {
    await expect(loadProfile("sun_quan")).rejects.toThrow("Unknown agent profile: sun_quan");
  });
});
