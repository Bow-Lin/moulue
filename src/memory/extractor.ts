import type { ChatModel } from "../llm/types";
import type { MemoryItem } from "../types/memory";
import type { MemoryCandidate, MemoryExtractionResult } from "./types";

const MAX_EXTRACTION_MESSAGES = 6;
const MAX_EXISTING_MEMORY_BRIEF = 5;

type ExtractMemoryInput = {
  agentId: string;
  userId: string;
  sessionId: string;
  recentMessages: Array<{ role: string; content: string }>;
  existingMemories: MemoryItem[];
  latestUserMessage: string;
};

const formatRecentMessages = (messages: Array<{ role: string; content: string }>): string => {
  if (messages.length === 0) {
    return "None.";
  }

  return messages.map((message) => `${message.role}: ${message.content}`).join("\n");
};

const formatExistingMemories = (memories: MemoryItem[]): string => {
  if (memories.length === 0) {
    return "None.";
  }

  return memories.map((memory) => `- (${memory.type}) ${memory.content}`).join("\n");
};

export class MemoryExtractor {
  private readonly chatModel: ChatModel;

  constructor(chatModel: ChatModel) {
    this.chatModel = chatModel;
  }

  async extract(input: ExtractMemoryInput): Promise<MemoryExtractionResult> {
    const systemPrompt = [
      "Extract long-term memory candidates from the recent conversation.",
      "Only return stable, reusable information that should matter across future sessions.",
      "Allowed types: user_preference, project, project_goal, fact, style, constraint, relationship.",
      "Return JSON only. If nothing is worth saving, return [].",
      `Agent: ${input.agentId}`,
      `User: ${input.userId}`,
      `Session: ${input.sessionId}`,
      `Existing memory brief:\n${formatExistingMemories(input.existingMemories.slice(0, MAX_EXISTING_MEMORY_BRIEF))}`,
      `Recent messages:\n${formatRecentMessages(input.recentMessages.slice(-MAX_EXTRACTION_MESSAGES))}`,
    ].join("\n\n");

    const raw = await this.chatModel.complete({
      systemPrompt,
      userMessage: "Return memory candidates as a JSON array.",
    });

    try {
      const parsed = JSON.parse(raw) as unknown;

      if (!Array.isArray(parsed)) {
        return {
          ran: true,
          candidates: [],
          rawText: raw,
          parseError: "Extractor response was not a JSON array.",
        };
      }

      const candidates = parsed.filter((item): item is MemoryCandidate => {
        return (
          typeof item === "object" &&
          item !== null &&
          typeof (item as MemoryCandidate).type === "string" &&
          typeof (item as MemoryCandidate).content === "string" &&
          typeof (item as MemoryCandidate).confidence === "number" &&
          typeof (item as MemoryCandidate).importance === "number" &&
          (typeof (item as MemoryCandidate).reason === "undefined" ||
            typeof (item as MemoryCandidate).reason === "string")
        );
      });

      return {
        ran: true,
        candidates,
        rawText: raw,
      };
    } catch {
      return {
        ran: true,
        candidates: [],
        rawText: raw,
        parseError: "Extractor response could not be parsed as JSON.",
      };
    }
  }
}
