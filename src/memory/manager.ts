import { SQLiteStore } from "../storage/sqlite-store";
import type { MemoryItem } from "../types/memory";

type MemoryContext = {
  sessionSummary: string | null;
  longTermMemories: MemoryItem[];
};

export class MemoryManager {
  private readonly store: SQLiteStore;

  constructor(store: SQLiteStore) {
    this.store = store;
  }

  getContext(userId: string, agentId: string, sessionId: string): MemoryContext {
    return {
      sessionSummary: this.store.getSessionSummary(sessionId),
      longTermMemories: this.store.listMemoryItems(userId, agentId),
    };
  }
}
