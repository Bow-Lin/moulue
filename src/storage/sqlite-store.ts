import { Database } from "bun:sqlite";
import type { ChatMessage, ChatRole, ChatSession } from "../types/chat";
import type { CreateMemoryItemInput, MemoryItem, MemoryType } from "../types/memory";

type SessionRow = {
  session_id: string;
  user_id: string;
  agent_id: string;
  created_at: string;
  summary: string | null;
};

type MessageRow = {
  id: number;
  session_id: string;
  role: ChatRole;
  content: string;
  created_at: string;
};

type MemoryItemRow = {
  id: string;
  user_id: string;
  agent_id: string;
  type: MemoryType;
  content: string;
  importance: number;
  created_at: string;
  updated_at: string;
};

type TableInfoRow = {
  name: string;
};

export class SQLiteStore {
  private readonly db: Database;

  constructor(path: string) {
    this.db = new Database(path);
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS sessions (
        session_id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        agent_id TEXT NOT NULL,
        summary TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (session_id) REFERENCES sessions(session_id)
      );

      CREATE TABLE IF NOT EXISTS memory_items (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        agent_id TEXT NOT NULL,
        type TEXT NOT NULL,
        content TEXT NOT NULL,
        importance INTEGER NOT NULL DEFAULT 3,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    this.ensureSessionSummaryColumn();
  }

  createSession(userId: string, agentId: string): string {
    const sessionId = crypto.randomUUID();

    this.db
      .query("INSERT INTO sessions (session_id, user_id, agent_id) VALUES (?, ?, ?)")
      .run(sessionId, userId, agentId);

    return sessionId;
  }

  appendMessage(sessionId: string, role: ChatRole, content: string): void {
    this.db
      .query("INSERT INTO messages (session_id, role, content) VALUES (?, ?, ?)")
      .run(sessionId, role, content);
  }

  getRecentMessages(sessionId: string, limit: number): ChatMessage[] {
    const rows = this.db
      .query(
        "SELECT id, session_id, role, content, created_at FROM messages WHERE session_id = ? ORDER BY id DESC LIMIT ?",
      )
      .all(sessionId, limit) as MessageRow[];

    return rows.reverse().map((row) => ({
      id: row.id,
      sessionId: row.session_id,
      role: row.role,
      content: row.content,
      createdAt: row.created_at,
    }));
  }

  getSession(sessionId: string): ChatSession | null {
    const row = this.db
      .query("SELECT session_id, user_id, agent_id, created_at, summary FROM sessions WHERE session_id = ?")
      .get(sessionId) as SessionRow | null;

    if (!row) {
      return null;
    }

    return {
      sessionId: row.session_id,
      userId: row.user_id,
      agentId: row.agent_id,
      createdAt: row.created_at,
    };
  }

  getSessionSummary(sessionId: string): string | null {
    const row = this.db
      .query("SELECT summary FROM sessions WHERE session_id = ?")
      .get(sessionId) as Pick<SessionRow, "summary"> | null;

    return row?.summary ?? null;
  }

  updateSessionSummary(sessionId: string, summary: string): void {
    this.db.query("UPDATE sessions SET summary = ? WHERE session_id = ?").run(summary, sessionId);
  }

  addMemoryItem(input: CreateMemoryItemInput): string {
    const memoryId = crypto.randomUUID();

    this.db
      .query(
        "INSERT INTO memory_items (id, user_id, agent_id, type, content, importance) VALUES (?, ?, ?, ?, ?, ?)",
      )
      .run(memoryId, input.userId, input.agentId, input.type, input.content, input.importance);

    return memoryId;
  }

  updateMemoryItem(memoryId: string, input: { content: string; importance: number }): void {
    this.db
      .query(
        "UPDATE memory_items SET content = ?, importance = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      )
      .run(input.content, input.importance, memoryId);
  }

  listMemoryItems(userId: string, agentId: string): MemoryItem[] {
    const rows = this.db
      .query(
        "SELECT id, user_id, agent_id, type, content, importance, created_at, updated_at FROM memory_items WHERE user_id = ? AND agent_id = ? ORDER BY updated_at DESC, created_at DESC",
      )
      .all(userId, agentId) as MemoryItemRow[];

    return rows.map((row) => ({
      id: row.id,
      userId: row.user_id,
      agentId: row.agent_id,
      type: row.type,
      content: row.content,
      importance: row.importance,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  private ensureSessionSummaryColumn(): void {
    const rows = this.db.query("PRAGMA table_info(sessions)").all() as TableInfoRow[];
    const hasSummaryColumn = rows.some((row) => row.name === "summary");

    if (!hasSummaryColumn) {
      this.db.exec("ALTER TABLE sessions ADD COLUMN summary TEXT");
    }
  }
}
