import { describe, expect, test } from "bun:test";
import { OpenAICompatibleChatModel } from "../../../src/llm/openai-client";

describe("OpenAICompatibleChatModel", () => {
  test("builds an OpenAI-compatible payload", () => {
    const client = new OpenAICompatibleChatModel({
      apiKey: "test-key",
      baseUrl: "https://api.openai.com/v1",
      modelName: "gpt-4o-mini",
    });

    const payload = client.buildPayload({
      systemPrompt: "profile",
      userMessage: "question",
    });

    expect(payload.model).toBe("gpt-4o-mini");
    expect(payload.messages[0].role).toBe("system");
    expect(payload.messages[1].role).toBe("user");
  });
});
