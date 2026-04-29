import { describe, expect, test } from "bun:test";
import { SessionSummarizer } from "../../../src/memory/session-summarizer";
import type { ChatMessage } from "../../../src/types/chat";
import type { ChatModel, ChatModelRequest } from "../../../src/llm/types";

class RecordingChatModel implements ChatModel {
  requests: ChatModelRequest[] = [];

  async complete(input: ChatModelRequest): Promise<string> {
    this.requests.push(input);
    return "Updated session summary.";
  }
}

const makeMessages = (count: number): ChatMessage[] => {
  return Array.from({ length: count }, (_, index) => ({
    id: `msg_${index + 1}`,
    sessionId: "session_1",
    role: index % 2 === 0 ? "user" : "assistant",
    content: `message-${index + 1}`,
    createdAt: `2026-04-29T00:00:${String(index).padStart(2, "0")}Z`,
  }));
};

describe("SessionSummarizer", () => {
  test("returns null when the message count does not exceed the trigger threshold", async () => {
    const chatModel = new RecordingChatModel();
    const summarizer = new SessionSummarizer({
      chatModel,
    });

    const result = await summarizer.summarizeSession({
      previousSummary: null,
      allMessages: makeMessages(12),
    });

    expect(result).toBeNull();
    expect(chatModel.requests).toHaveLength(0);
  });

  test("summarizes only foldable messages and preserves the recent window", async () => {
    const chatModel = new RecordingChatModel();
    const summarizer = new SessionSummarizer({
      chatModel,
    });

    const result = await summarizer.summarizeSession({
      previousSummary: "Earlier summary.",
      allMessages: makeMessages(14),
    });

    expect(result).toBe("Updated session summary.");
    expect(chatModel.requests).toHaveLength(1);
    expect(chatModel.requests[0]?.systemPrompt).toContain("Previous summary:\nEarlier summary.");
    expect(chatModel.requests[0]?.systemPrompt).toContain("message-1");
    expect(chatModel.requests[0]?.systemPrompt).toContain("message-6");
    expect(chatModel.requests[0]?.systemPrompt).not.toContain("message-7");
    expect(chatModel.requests[0]?.systemPrompt).not.toContain("message-14");
  });
});
