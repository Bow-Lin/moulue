import { describe, expect, test } from "bun:test";
import { SQLiteStore } from "../../../src/storage/sqlite-store";

describe("SQLiteStore", () => {
  test("creates a session and returns recent messages in chronological order", () => {
    const store = new SQLiteStore(":memory:");
    const sessionId = store.createSession("user_1", "zhuge_liang");
    store.appendMessage(sessionId, "user", "How should I govern myself?");
    store.appendMessage(sessionId, "assistant", "First govern your own heart.");
    const messages = store.getRecentMessages(sessionId, 2);
    expect(messages.map((message) => message.role)).toEqual(["user", "assistant"]);
  });

  test("updates and reads a session summary", () => {
    const store = new SQLiteStore(":memory:");
    const sessionId = store.createSession("user_1", "zhuge_liang");

    store.updateSessionSummary(sessionId, "The user is building a local chat agent MVP.");

    expect(store.getSessionSummary(sessionId)).toBe("The user is building a local chat agent MVP.");
  });

  test("stores and lists long-term memory items for a user-agent pair", () => {
    const store = new SQLiteStore(":memory:");

    store.addMemoryItem({
      userId: "user_1",
      agentId: "zhuge_liang",
      type: "project",
      content: "The user is building a Bun and TypeScript chat agent.",
      importance: 4,
    });

    const memories = store.listMemoryItems("user_1", "zhuge_liang");
    expect(memories).toHaveLength(1);
    expect(memories[0]?.type).toBe("project");
    expect(memories[0]?.content).toContain("Bun and TypeScript");
  });
});
