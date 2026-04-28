import { describe, expect, test } from "bun:test";

describe("package imports", () => {
  test("imports the root entry", async () => {
    const mod = await import("../../src/index");
    expect(mod).toBeDefined();
  });
});
