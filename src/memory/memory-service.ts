import { SQLiteStore } from "../storage/sqlite-store";
import type { MemoryItem } from "../types/memory";
import type { MemoryApplyDecision, MemoryApplyResult, MemoryCandidate } from "./types";

const MIN_CONFIDENCE = 0.7;

const normalizeContent = (value: string): string => {
  return value.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff\s]/gi, " ").replace(/\s+/g, " ").trim();
};

const isExactDuplicate = (existing: MemoryItem, candidate: MemoryCandidate): boolean => {
  return normalizeContent(existing.content) === normalizeContent(candidate.content);
};

const tokenSimilarity = (left: string, right: string): number => {
  const leftTokens = new Set(normalizeContent(left).split(" ").filter(Boolean));
  const rightTokens = new Set(normalizeContent(right).split(" ").filter(Boolean));

  if (leftTokens.size === 0 || rightTokens.size === 0) {
    return 0;
  }

  let intersection = 0;

  for (const token of leftTokens) {
    if (rightTokens.has(token)) {
      intersection += 1;
    }
  }

  return intersection / Math.max(leftTokens.size, rightTokens.size);
};

const findSimilarMemory = (existingMemories: MemoryItem[], candidate: MemoryCandidate): MemoryItem | null => {
  for (const memory of existingMemories) {
    if (memory.type !== candidate.type) {
      continue;
    }

    if (
      normalizeContent(memory.content).includes(normalizeContent(candidate.content)) ||
      normalizeContent(candidate.content).includes(normalizeContent(memory.content)) ||
      tokenSimilarity(memory.content, candidate.content) >= 0.6
    ) {
      return memory;
    }
  }

  return null;
};

export class MemoryService {
  private readonly store: SQLiteStore;

  constructor(store: SQLiteStore) {
    this.store = store;
  }

  applyCandidates(userId: string, agentId: string, candidates: MemoryCandidate[]): MemoryApplyResult {
    const summary: MemoryApplyResult["summary"] = {
      inserted: 0,
      updated: 0,
      skipped: 0,
      discarded: 0,
    };
    const applied: MemoryApplyDecision[] = [];

    for (const [candidateIndex, candidate] of candidates.entries()) {
      if (candidate.confidence < MIN_CONFIDENCE) {
        summary.discarded += 1;
        applied.push({
          candidateIndex,
          action: "discard_low_confidence",
          reason: "Candidate confidence was below the minimum threshold.",
        });
        continue;
      }

      const existingMemories = this.store.listMemoryItems(userId, agentId);
      const exactDuplicate = existingMemories.find((memory) => isExactDuplicate(memory, candidate));

      if (exactDuplicate) {
        summary.skipped += 1;
        applied.push({
          candidateIndex,
          action: "skip_duplicate",
          memoryId: exactDuplicate.id,
          reason: "An existing memory with the same normalized content already exists.",
        });
        continue;
      }

      const similarMemory = findSimilarMemory(existingMemories, candidate);

      if (similarMemory) {
        this.store.updateMemoryItem(similarMemory.id, {
          content: candidate.content,
          importance: Math.max(similarMemory.importance, candidate.importance),
        });
        summary.updated += 1;
        applied.push({
          candidateIndex,
          action: "update",
          memoryId: similarMemory.id,
          reason: "A similar memory of the same type already existed and was refreshed.",
        });
        continue;
      }

      const memoryId = this.store.addMemoryItem({
        userId,
        agentId,
        type: candidate.type,
        content: candidate.content,
        importance: candidate.importance,
      });
      summary.inserted += 1;
      applied.push({
        candidateIndex,
        action: "insert",
        memoryId,
        reason: "No matching memory existed, so a new long-term memory was inserted.",
      });
    }

    return {
      applied,
      summary,
    };
  }
}
