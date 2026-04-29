import { CharacterChatAgent } from "./base";
import { InvalidAgentIdError, UnknownAgentError } from "./errors";
import { loadLocalEnv } from "../config/env";
import { FakeChatModel } from "../llm/fake-chat-model";
import { OpenAICompatibleChatModel } from "../llm/openai-client";
import type { ChatModel } from "../llm/types";
import { SQLiteStore } from "../storage/sqlite-store";

type BuildAgentOptions = {
  agentId: string;
  store: SQLiteStore;
};

type SupportedProvider = "fake" | "glm" | "bailian";

type EnvLike = Record<string, string | undefined>;
type SelectedChatModel = {
  chatModel: ChatModel;
  provider: SupportedProvider;
};

const readProvider = (env: EnvLike): SupportedProvider => {
  if (env.LLM_PROVIDER === "glm" || env.LLM_PROVIDER === "bailian" || env.LLM_PROVIDER === "fake") {
    return env.LLM_PROVIDER;
  }

  return "fake";
};

const buildOpenAICompatibleModel = (
  apiKey: string | undefined,
  baseUrl: string | undefined,
  modelName: string | undefined,
  provider: SupportedProvider,
): SelectedChatModel => {
  if (apiKey && baseUrl && modelName) {
    return {
      chatModel: new OpenAICompatibleChatModel({
        apiKey,
        baseUrl,
        modelName,
      }),
      provider,
    };
  }

  return {
    chatModel: new FakeChatModel(),
    provider: "fake",
  };
};

export const selectChatModel = (env: EnvLike = Bun.env as EnvLike): SelectedChatModel => {
  const provider = readProvider(env);

  if (provider === "glm") {
    return buildOpenAICompatibleModel(env.GLM_API_KEY, env.GLM_BASE_URL, env.GLM_MODEL, "glm");
  }

  if (provider === "bailian") {
    return buildOpenAICompatibleModel(
      env.BAILIAN_API_KEY,
      env.BAILIAN_BASE_URL,
      env.BAILIAN_MODEL,
      "bailian",
    );
  }

  return {
    chatModel: new FakeChatModel(),
    provider: "fake",
  };
};

export const buildAgent = async (options: BuildAgentOptions): Promise<CharacterChatAgent> => {
  loadLocalEnv();
  const selected = selectChatModel();

  try {
    return await CharacterChatAgent.create({
      agentId: options.agentId,
      store: options.store,
      chatModel: selected.chatModel,
      providerName: selected.provider,
    });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Invalid agent profile id:")) {
      throw new InvalidAgentIdError(options.agentId);
    }

    if (error instanceof Error && error.message.startsWith("Unknown agent profile:")) {
      throw new UnknownAgentError(options.agentId);
    }

    throw error;
  }
};
