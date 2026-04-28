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
});
