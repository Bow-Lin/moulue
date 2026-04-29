import { describe, expect, test } from "bun:test";
import { CharacterChatAgent } from "../../../src/agents/base";
import { SQLiteStore } from "../../../src/storage/sqlite-store";
import type { ChatModel, ChatModelRequest } from "../../../src/llm/types";

class RecordingChatModel implements ChatModel {
  requests: ChatModelRequest[] = [];
  extractionResponse = JSON.stringify([
    {
      type: "project_goal",
      content: "The user wants this project to become a compelling open-source demo and reach 500 stars.",
      confidence: 0.95,
      importance: 5,
      reason: "The user stated a durable success target for the project.",
    },
  ]);

  async complete(input: ChatModelRequest): Promise<string> {
    this.requests.push(input);

    if (input.systemPrompt.includes("Summarize the current session state")) {
      return "The session summary now notes the user's chat-agent MVP goals.";
    }

    if (input.systemPrompt.includes("Extract long-term memory candidates")) {
      return this.extractionResponse;
    }

    return "First establish order within your own heart.";
  }
}

describe("CharacterChatAgent", () => {
  test("returns a reply and persists a full turn", async () => {
    const store = new SQLiteStore(":memory:");
    const chatModel = new RecordingChatModel();
    const agent = await CharacterChatAgent.create({
      agentId: "zhuge_liang",
      store,
      chatModel,
    });

    const result = await agent.reply({
      userId: "user_1",
      message: "How should I steady my heart?",
    });

    expect(result.reply.length).toBeGreaterThan(0);
    expect(typeof result.sessionId).toBe("string");

    const messages = store.getRecentMessages(result.sessionId, 2);
    expect(messages.map((message) => message.role)).toEqual(["user", "assistant"]);
  });

  test("includes long-term memory and session summary in the prompt", async () => {
    const store = new SQLiteStore(":memory:");
    const chatModel = new RecordingChatModel();
    const agent = await CharacterChatAgent.create({
      agentId: "zhuge_liang",
      store,
      chatModel,
    });

    store.addMemoryItem({
      userId: "user_1",
      agentId: "zhuge_liang",
      type: "user_preference",
      content: "The user prefers architecture before implementation details.",
      importance: 4,
    });

    const sessionId = store.createSession("user_1", "zhuge_liang");
    store.updateSessionSummary(sessionId, "The user is planning a three-layer memory system.");

    await agent.reply({
      userId: "user_1",
      sessionId,
      message: "What should I build first?",
    });

    expect(chatModel.requests[0]?.systemPrompt).toContain("Long-term memory:");
    expect(chatModel.requests[0]?.systemPrompt).toContain("architecture before implementation");
    expect(chatModel.requests[0]?.systemPrompt).toContain("Session summary:");
    expect(chatModel.requests[0]?.systemPrompt).toContain("three-layer memory system");
    expect(chatModel.requests[0]?.systemPrompt).toContain("Decision policy:");
    expect(chatModel.requests[0]?.systemPrompt).toContain("Relationships:");
  });

  test("uses the selected cao cao profile when assembling the prompt", async () => {
    const store = new SQLiteStore(":memory:");
    const chatModel = new RecordingChatModel();
    const agent = await CharacterChatAgent.create({
      agentId: "cao_cao",
      store,
      chatModel,
    });

    await agent.reply({
      userId: "user_1",
      message: "How should I judge Liu Bei?",
    });

    expect(chatModel.requests[0]?.systemPrompt).toContain("You are Cao Cao of Wei.");
    expect(chatModel.requests[0]?.systemPrompt).toContain("Identity:");
    expect(chatModel.requests[0]?.systemPrompt).toContain("Liu Bei:");
    expect(chatModel.requests[0]?.systemPrompt).toContain("Decision policy:");
  });

  test("updates the session summary after the recent-message threshold is exceeded", async () => {
    const store = new SQLiteStore(":memory:");
    const chatModel = new RecordingChatModel();
    const agent = await CharacterChatAgent.create({
      agentId: "zhuge_liang",
      store,
      chatModel,
    });

    const sessionId = store.createSession("user_1", "zhuge_liang");

    for (let index = 0; index < 12; index += 1) {
      store.appendMessage(sessionId, index % 2 === 0 ? "user" : "assistant", `message-${index + 1}`);
    }

    await agent.reply({
      userId: "user_1",
      sessionId,
      message: "Please continue the plan.",
    });

    expect(store.getSessionSummary(sessionId)).toBe(
      "The session summary now notes the user's chat-agent MVP goals.",
    );
    expect(
      chatModel.requests.some((request) =>
        request.systemPrompt.includes("Summarize the current session state"),
      ),
    ).toBe(true);
  });

  test("extracts long-term memory after a turn and injects it into the next prompt", async () => {
    const store = new SQLiteStore(":memory:");
    const chatModel = new RecordingChatModel();
    const agent = await CharacterChatAgent.create({
      agentId: "zhuge_liang",
      store,
      chatModel,
      providerName: "fake",
    });

    await agent.reply({
      userId: "user_1",
      message: "I want this project to become a compelling open-source demo and reach 500 stars.",
    });

    const memories = store.listMemoryItems("user_1", "zhuge_liang");
    expect(memories).toHaveLength(1);
    expect(memories[0]?.type).toBe("project_goal");

    await agent.reply({
      userId: "user_1",
      message: "What should I build first?",
    });

    const secondReplyRequest = chatModel.requests.findLast(
      (request) => request.userMessage === "What should I build first?",
    );
    expect(secondReplyRequest?.systemPrompt).toContain("reach 500 stars");
  });

  test("returns debug trace with beforeReply and afterReply extraction details", async () => {
    const store = new SQLiteStore(":memory:");
    const chatModel = new RecordingChatModel();
    const agent = await CharacterChatAgent.create({
      agentId: "zhuge_liang",
      store,
      chatModel,
      providerName: "fake",
    });

    const result = await agent.reply({
      userId: "user_1",
      message: "I want this project to become a compelling open-source demo and reach 500 stars.",
      debug: {
        enabled: true,
      },
    });

    expect(result.debug?.beforeReply.provider).toBe("fake");
    expect(result.debug?.beforeReply.memoriesUsed).toHaveLength(0);
    expect(result.debug?.afterReply?.extraction.ran).toBe(true);
    expect(result.debug?.afterReply?.extraction.candidates[0]?.type).toBe("project_goal");
    expect(result.debug?.afterReply?.extraction.candidates[0]?.reason).toContain("durable success target");
    expect(result.debug?.afterReply?.extraction.applied[0]).toMatchObject({
      candidateIndex: 0,
      action: "insert",
    });
  });

  test("surfaces extractor parse errors in debug without failing the chat reply", async () => {
    const store = new SQLiteStore(":memory:");
    const chatModel = new RecordingChatModel();
    chatModel.extractionResponse = "not-json";
    const agent = await CharacterChatAgent.create({
      agentId: "zhuge_liang",
      store,
      chatModel,
      providerName: "fake",
    });

    const result = await agent.reply({
      userId: "user_1",
      message: "I want this project to become a compelling open-source demo and reach 500 stars.",
      debug: {
        enabled: true,
      },
    });

    expect(result.reply).toContain("First establish order");
    expect(result.debug?.afterReply?.extraction.ran).toBe(true);
    expect(result.debug?.afterReply?.extraction.candidates).toHaveLength(0);
    expect(result.debug?.afterReply?.extraction.parseError).toBeDefined();
  });

  test("keeps long-term memory isolated by agent id", async () => {
    const store = new SQLiteStore(":memory:");
    const chatModel = new RecordingChatModel();
    const zhugeAgent = await CharacterChatAgent.create({
      agentId: "zhuge_liang",
      store,
      chatModel,
      providerName: "fake",
    });
    const caoAgent = await CharacterChatAgent.create({
      agentId: "cao_cao",
      store,
      chatModel,
      providerName: "fake",
    });

    store.addMemoryItem({
      userId: "user_1",
      agentId: "zhuge_liang",
      type: "project_goal",
      content: "The user wants to unify the realm through patient alliances.",
      importance: 5,
    });

    const result = await caoAgent.reply({
      userId: "user_1",
      message: "How should I unify the realm?",
      debug: {
        enabled: true,
      },
    });

    expect(result.debug?.beforeReply.memoriesUsed).toHaveLength(0);

    const zhugeResult = await zhugeAgent.reply({
      userId: "user_1",
      message: "How should I unify the realm?",
      debug: {
        enabled: true,
      },
    });

    expect(zhugeResult.debug?.beforeReply.memoriesUsed).toHaveLength(1);
  });
});
