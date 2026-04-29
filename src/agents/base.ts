import { loadProfile } from "./profiles/loader";
import { InvalidSessionError } from "./errors";
import { MemoryExtractor } from "../memory/extractor";
import { MemoryManager } from "../memory/manager";
import { MemoryService } from "../memory/memory-service";
import { SessionSummarizer } from "../memory/session-summarizer";
import type { AgentProfile } from "../types/agent";
import type { ChatMessage } from "../types/chat";
import type { ChatModel } from "../llm/types";
import type { MemoryItem } from "../types/memory";
import { SQLiteStore } from "../storage/sqlite-store";
import type { MemoryApplyResult, MemoryExtractionResult } from "../memory/types";

type CreateCharacterChatAgentOptions = {
  agentId: string;
  store: SQLiteStore;
  chatModel: ChatModel;
  providerName?: string;
};

type ReplyInput = {
  userId: string;
  message: string;
  sessionId?: string;
  debug?: {
    enabled: boolean;
    includeMemoryContent?: boolean;
    includePrompt?: boolean;
    includeRawExtraction?: boolean;
  };
};

type ReplyResult = {
  sessionId: string;
  reply: string;
  agentId: string;
  debug?: {
    beforeReply: {
      agentId: string;
      provider: string;
      prompt: {
        longTermMemoryCount: number;
        hasSessionSummary: boolean;
        recentMessageCount: number;
      };
      memoriesUsed: Array<{
        id: string;
        type: MemoryItem["type"];
        importance: number;
        preview: string;
        content?: string;
      }>;
      assembledPrompt?: string;
    };
    afterReply: {
      extraction: {
        ran: boolean;
        candidates: MemoryExtractionResult["candidates"];
        applied: MemoryApplyResult["applied"];
        rawText?: string;
        parseError?: string;
      };
    };
  };
};

const RECENT_MESSAGE_LIMIT = 8;

const formatRecentMessages = (messages: ChatMessage[]): string => {
  if (messages.length === 0) {
    return "None.";
  }

  return messages.map((message) => `${message.role}: ${message.content}`).join("\n");
};

const formatLongTermMemories = (memories: MemoryItem[]): string => {
  if (memories.length === 0) {
    return "None.";
  }

  return memories
    .map((memory) => `- (${memory.type}, importance ${memory.importance}) ${memory.content}`)
    .join("\n");
};

const previewMemoryContent = (content: string): string => {
  return content.length > 80 ? `${content.slice(0, 77)}...` : content;
};

const formatList = (items: string[]): string => {
  if (items.length === 0) {
    return "None.";
  }

  return items.map((item) => `- ${item}`).join("\n");
};

const formatRelationships = (relationships: Record<string, string>): string => {
  const entries = Object.entries(relationships);

  if (entries.length === 0) {
    return "None.";
  }

  return entries
    .map(([name, description]) => {
      const label = name
        .split("_")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
      return `- ${label}: ${description}`;
    })
    .join("\n");
};

const buildSystemPrompt = (
  profile: AgentProfile,
  sessionSummary: string | null,
  longTermMemories: MemoryItem[],
  recentMessages: ChatMessage[],
): string => {
  return [
    `You are ${profile.name} of ${profile.faction}.`,
    [
      "Identity:",
      `Title: ${profile.identity.title}`,
      `Role: ${profile.identity.role}`,
      `Era context: ${profile.identity.eraContext}`,
    ].join("\n"),
    [
      "Background:",
      profile.background.summary,
      "Formative experiences:",
      formatList(profile.background.formativeExperiences),
    ].join("\n"),
    `Core values:\n${formatList(profile.coreValues)}`,
    [
      "Goals:",
      "Long-term:",
      formatList(profile.goals.longTerm),
      "Short-term:",
      formatList(profile.goals.shortTerm),
    ].join("\n"),
    [
      "Personality:",
      "Traits:",
      formatList(profile.personality.traits),
      "Strengths:",
      formatList(profile.personality.strengths),
      "Flaws:",
      formatList(profile.personality.flaws),
    ].join("\n"),
    [
      "Decision policy:",
      `Default strategy: ${profile.decisionPolicy.defaultStrategy}`,
      "Prefers:",
      formatList(profile.decisionPolicy.prefers),
      "Avoids:",
      formatList(profile.decisionPolicy.avoids),
      "When weak:",
      formatList(profile.decisionPolicy.whenWeak),
      "When strong:",
      formatList(profile.decisionPolicy.whenStrong),
    ].join("\n"),
    `Relationships:\n${formatRelationships(profile.relationships)}`,
    [
      "Speaking style:",
      "Tone:",
      formatList(profile.speakingStyle.tone),
      "Rhetorical patterns:",
      formatList(profile.speakingStyle.rhetoricalPatterns),
    ].join("\n"),
    `Speech constraints:\n${formatList(profile.speechConstraints)}`,
    [
      "Response policy:",
      `Default length: ${profile.responsePolicy.defaultLength}`,
      "Answer structure:",
      formatList(profile.responsePolicy.answerStructure),
    ].join("\n"),
    `Long-term memory:\n${formatLongTermMemories(longTermMemories)}`,
    `Session summary:\n${sessionSummary ?? "None."}`,
    `Recent conversation:\n${formatRecentMessages(recentMessages)}`,
  ].join("\n\n");
};

export class CharacterChatAgent {
  readonly agentId: string;
  private readonly profile: AgentProfile;
  private readonly store: SQLiteStore;
  private readonly memoryManager: MemoryManager;
  private readonly memoryExtractor: MemoryExtractor;
  private readonly memoryService: MemoryService;
  private readonly sessionSummarizer: SessionSummarizer;
  private readonly chatModel: ChatModel;
  private readonly providerName: string;

  private constructor(options: {
    agentId: string;
    profile: AgentProfile;
    store: SQLiteStore;
    chatModel: ChatModel;
    providerName?: string;
  }) {
    this.agentId = options.agentId;
    this.profile = options.profile;
    this.store = options.store;
    this.memoryManager = new MemoryManager(options.store);
    this.memoryExtractor = new MemoryExtractor(options.chatModel);
    this.memoryService = new MemoryService(options.store);
    this.sessionSummarizer = new SessionSummarizer({
      chatModel: options.chatModel,
      recentMessageLimit: RECENT_MESSAGE_LIMIT,
      triggerMessageCount: 12,
    });
    this.chatModel = options.chatModel;
    this.providerName = options.providerName ?? "unknown";
  }

  static async create(options: CreateCharacterChatAgentOptions): Promise<CharacterChatAgent> {
    const profile = await loadProfile(options.agentId);
    return new CharacterChatAgent({
      agentId: options.agentId,
      profile,
      store: options.store,
      chatModel: options.chatModel,
      providerName: options.providerName,
    });
  }

  async reply(input: ReplyInput): Promise<ReplyResult> {
    const sessionId = this.resolveSessionId(input);
    const memoryContext = this.memoryManager.getContext(input.userId, this.agentId, sessionId);
    const recentMessages = this.store.getRecentMessages(sessionId, RECENT_MESSAGE_LIMIT);
    const systemPrompt = buildSystemPrompt(
      this.profile,
      memoryContext.sessionSummary,
      memoryContext.longTermMemories,
      recentMessages,
    );
    const reply = await this.chatModel.complete({
      systemPrompt,
      messages: recentMessages.map((message) => ({
        role: message.role,
        content: message.content,
      })),
      userMessage: input.message,
    });

    this.store.appendMessage(sessionId, "user", input.message);
    this.store.appendMessage(sessionId, "assistant", reply);
    await this.maybeUpdateSessionSummary(sessionId);
    const extractionOutcome = await this.maybeExtractLongTermMemory(input.userId, sessionId, input.message);

    return {
      sessionId,
      reply,
      agentId: this.agentId,
      debug: input.debug?.enabled
        ? {
            beforeReply: {
              agentId: this.agentId,
              provider: this.providerName,
              prompt: {
                longTermMemoryCount: memoryContext.longTermMemories.length,
                hasSessionSummary: memoryContext.sessionSummary !== null,
                recentMessageCount: recentMessages.length,
              },
              memoriesUsed: memoryContext.longTermMemories.map((memory) => ({
                id: memory.id,
                type: memory.type,
                importance: memory.importance,
                preview: previewMemoryContent(memory.content),
                ...(input.debug?.includeMemoryContent ? { content: memory.content } : {}),
              })),
              ...(input.debug?.includePrompt ? { assembledPrompt: systemPrompt } : {}),
            },
            afterReply: {
              extraction: {
                ran: extractionOutcome.extraction.ran,
                candidates: extractionOutcome.extraction.candidates,
                applied: extractionOutcome.applied.applied,
                ...(input.debug?.includeRawExtraction && extractionOutcome.extraction.rawText
                  ? { rawText: extractionOutcome.extraction.rawText }
                  : {}),
                ...(extractionOutcome.extraction.parseError
                  ? { parseError: extractionOutcome.extraction.parseError }
                  : {}),
              },
            },
          }
        : undefined,
    };
  }

  private resolveSessionId(input: ReplyInput): string {
    if (!input.sessionId) {
      return this.store.createSession(input.userId, this.agentId);
    }

    const session = this.store.getSession(input.sessionId);

    if (!session || session.userId !== input.userId || session.agentId !== this.agentId) {
      throw new InvalidSessionError(input.sessionId);
    }

    return input.sessionId;
  }

  private async maybeUpdateSessionSummary(sessionId: string): Promise<void> {
    const allMessages = this.store.getRecentMessages(sessionId, Number.MAX_SAFE_INTEGER);
    const previousSummary = this.store.getSessionSummary(sessionId);
    const summary = await this.sessionSummarizer.summarizeSession({
      previousSummary,
      allMessages,
    });

    if (summary !== null) {
      this.store.updateSessionSummary(sessionId, summary);
    }
  }

  private async maybeExtractLongTermMemory(
    userId: string,
    sessionId: string,
    latestUserMessage: string,
  ): Promise<{ extraction: MemoryExtractionResult; applied: MemoryApplyResult }> {
    const recentMessages = this.store.getRecentMessages(sessionId, 6);
    const existingMemories = this.store.listMemoryItems(userId, this.agentId).slice(0, 5);
    const extraction = await this.memoryExtractor.extract({
      agentId: this.agentId,
      userId,
      sessionId,
      recentMessages: recentMessages.map((message) => ({
        role: message.role,
        content: message.content,
      })),
      existingMemories,
      latestUserMessage,
    });

    const applied = this.memoryService.applyCandidates(userId, this.agentId, extraction.candidates);

    return {
      extraction,
      applied,
    };
  }
}
