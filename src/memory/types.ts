import type { MemoryType } from "../types/memory";

export type MemoryCandidate = {
  type: MemoryType;
  content: string;
  confidence: number;
  importance: number;
  reason?: string;
};

export type MemoryExtractionResult = {
  ran: boolean;
  candidates: MemoryCandidate[];
  rawText?: string;
  parseError?: string;
};

export type MemoryApplyAction =
  | "insert"
  | "update"
  | "skip_duplicate"
  | "discard_low_confidence";

export type MemoryApplyDecision = {
  candidateIndex: number;
  action: MemoryApplyAction;
  memoryId?: string;
  reason: string;
};

export type MemoryApplySummary = {
  inserted: number;
  updated: number;
  skipped: number;
  discarded: number;
};

export type MemoryApplyResult = {
  applied: MemoryApplyDecision[];
  summary: MemoryApplySummary;
};
