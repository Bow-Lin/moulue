import { Database } from "bun:sqlite";
import type { ChatMessage, ChatRole, ChatSession } from "../types/chat";

type SessionRow = {
  session_id: string;
  user_id: string;
  agent_id: string;
  created_at: string;
};

type MessageRow = {
  id: number;
  session_id: string;
  role: ChatRole;
  content: string;
  created_at: string;
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
    `);
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
      .query("SELECT session_id, user_id, agent_id, created_at FROM sessions WHERE session_id = ?")
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
}
