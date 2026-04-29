import type { ChatModel, ChatModelRequest } from "./types";

const lowerIncludes = (value: string, pattern: string): boolean => {
  return value.toLowerCase().includes(pattern);
};

export class FakeChatModel implements ChatModel {
  async complete(input: ChatModelRequest): Promise<string> {
    if (input.systemPrompt.includes("Extract long-term memory candidates")) {
      return "[]";
    }

    if (input.systemPrompt.includes("Summarize the current session state")) {
      return "The session remains focused on a local chat agent plan.";
    }

    const message = input.userMessage.trim();

    if (lowerIncludes(message, "patience") || lowerIncludes(message, "耐心")) {
      return "耐心不是迟缓，而是先定其心，再择其时。";
    }

    if (lowerIncludes(message, "steady") || lowerIncludes(message, "心")) {
      return "欲定人心，先正己意。心不躁，则事自有次第。";
    }

    return "先审局势，再审己心。能自持者，方能持事。";
  }
}
