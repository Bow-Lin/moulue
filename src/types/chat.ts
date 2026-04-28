export type ChatRole = "user" | "assistant";

export type ChatSession = {
  sessionId: string;
  userId: string;
  agentId: string;
  createdAt: string;
};

export type ChatMessage = {
  id: number;
  sessionId: string;
  role: ChatRole;
  content: string;
  createdAt: string;
};
