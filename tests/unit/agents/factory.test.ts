import { describe, expect, test } from "bun:test";
import { selectChatModel } from "../../../src/agents/factory";
import { FakeChatModel } from "../../../src/llm/fake-chat-model";
import { OpenAICompatibleChatModel } from "../../../src/llm/openai-client";

describe("selectChatModel", () => {
  test("selects fake model when configured", () => {
    const selected = selectChatModel({
      LLM_PROVIDER: "fake",
    });

    expect(selected.provider).toBe("fake");
    expect(selected.chatModel).toBeInstanceOf(FakeChatModel);
  });

  test("selects glm when configuration is complete", () => {
    const selected = selectChatModel({
      LLM_PROVIDER: "glm",
      GLM_API_KEY: "glm-key",
      GLM_BASE_URL: "https://open.bigmodel.cn/api/paas/v4",
      GLM_MODEL: "glm-4.5-flash",
    });

    expect(selected.provider).toBe("glm");
    expect(selected.chatModel).toBeInstanceOf(OpenAICompatibleChatModel);
  });

  test("selects bailian when configuration is complete", () => {
    const selected = selectChatModel({
      LLM_PROVIDER: "bailian",
      BAILIAN_API_KEY: "bailian-key",
      BAILIAN_BASE_URL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
      BAILIAN_MODEL: "qwen-plus",
    });

    expect(selected.provider).toBe("bailian");
    expect(selected.chatModel).toBeInstanceOf(OpenAICompatibleChatModel);
  });

  test("falls back to fake when selected provider is incomplete", () => {
    const selected = selectChatModel({
      LLM_PROVIDER: "glm",
      GLM_API_KEY: "glm-key",
    });

    expect(selected.provider).toBe("fake");
    expect(selected.chatModel).toBeInstanceOf(FakeChatModel);
  });
});
