import type { ChatModel, ChatModelRequest } from "./types";

type OpenAICompatibleChatModelOptions = {
  apiKey: string;
  baseUrl: string;
  modelName: string;
};

type OpenAIMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type OpenAIResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

export class OpenAICompatibleChatModel implements ChatModel {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly modelName: string;

  constructor(options: OpenAICompatibleChatModelOptions) {
    this.apiKey = options.apiKey;
    this.baseUrl = options.baseUrl.replace(/\/$/, "");
    this.modelName = options.modelName;
  }

  buildPayload(input: ChatModelRequest): { model: string; messages: OpenAIMessage[] } {
    const messages: OpenAIMessage[] = [{ role: "system", content: input.systemPrompt }];

    for (const message of input.messages ?? []) {
      messages.push({
        role: message.role,
        content: message.content,
      });
    }

    messages.push({ role: "user", content: input.userMessage });

    return {
      model: this.modelName,
      messages,
    };
  }

  async complete(input: ChatModelRequest): Promise<string> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(this.buildPayload(input)),
    });

    if (!response.ok) {
      throw new Error(`OpenAI-compatible request failed with status ${response.status}`);
    }

    const data = (await response.json()) as OpenAIResponse;
    const content = data.choices?.[0]?.message?.content?.trim();

    if (!content) {
      throw new Error("OpenAI-compatible response did not include message content");
    }

    return content;
  }
}
