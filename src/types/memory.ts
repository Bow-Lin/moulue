export type MemoryType =
  | "user_preference"
  | "project"
  | "project_goal"
  | "fact"
  | "style"
  | "constraint"
  | "relationship";

export type MemoryItem = {
  id: string;
  userId: string;
  agentId: string;
  type: MemoryType;
  content: string;
  importance: number;
  createdAt: string;
  updatedAt: string;
};

export type CreateMemoryItemInput = {
  userId: string;
  agentId: string;
  type: MemoryType;
  content: string;
  importance: number;
};
