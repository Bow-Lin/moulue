import type { ChatRole } from "../types/chat";

export type ChatModelMessage = {
  role: ChatRole;
  content: string;
};

export type ChatModelRequest = {
  systemPrompt: string;
  messages?: ChatModelMessage[];
  userMessage: string;
};

export interface ChatModel {
  complete(input: ChatModelRequest): Promise<string>;
}
