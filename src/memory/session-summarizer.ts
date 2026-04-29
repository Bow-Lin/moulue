import type { ChatModel } from "../llm/types";
import type { ChatMessage } from "../types/chat";

type SessionSummarizerOptions = {
  chatModel: ChatModel;
  recentMessageLimit?: number;
  triggerMessageCount?: number;
};

type SummarizeSessionInput = {
  previousSummary: string | null;
  allMessages: ChatMessage[];
};

const formatRecentMessages = (messages: ChatMessage[]): string => {
  if (messages.length === 0) {
    return "None.";
  }

  return messages.map((message) => `${message.role}: ${message.content}`).join("\n");
};

export class SessionSummarizer {
  private readonly chatModel: ChatModel;
  private readonly recentMessageLimit: number;
  private readonly triggerMessageCount: number;

  constructor(options: SessionSummarizerOptions) {
    this.chatModel = options.chatModel;
    this.recentMessageLimit = options.recentMessageLimit ?? 8;
    this.triggerMessageCount = options.triggerMessageCount ?? 12;
  }

  async summarizeSession(input: SummarizeSessionInput): Promise<string | null> {
    if (input.allMessages.length <= this.triggerMessageCount) {
      return null;
    }

    const foldableMessages = input.allMessages.slice(
      0,
      Math.max(0, input.allMessages.length - this.recentMessageLimit),
    );
    const summaryPrompt = [
      "Summarize the current session state.",
      `Previous summary:\n${input.previousSummary ?? "None."}`,
      `Messages to fold into summary:\n${formatRecentMessages(foldableMessages)}`,
      "Return a concise summary that preserves the user's goals, decisions, constraints, and unresolved questions.",
    ].join("\n\n");

    return this.chatModel.complete({
      systemPrompt: summaryPrompt,
      userMessage: "Update the session summary.",
    });
  }
}
