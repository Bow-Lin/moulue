import { describe, expect, test } from "bun:test";
import { MemoryService } from "../../../src/memory/memory-service";
import { SQLiteStore } from "../../../src/storage/sqlite-store";

describe("MemoryService", () => {
  test("discards low-confidence candidates", () => {
    const store = new SQLiteStore(":memory:");
    const service = new MemoryService(store);

    const result = service.applyCandidates("user_1", "zhuge_liang", [
      {
        type: "project_goal",
        content: "The user wants this project to gain 500 stars.",
        confidence: 0.4,
        importance: 5,
      },
    ]);

    expect(result.summary.discarded).toBe(1);
    expect(result.applied).toHaveLength(1);
    expect(result.applied[0]).toMatchObject({
      candidateIndex: 0,
      action: "discard_low_confidence",
    });
    expect(store.listMemoryItems("user_1", "zhuge_liang")).toHaveLength(0);
  });

  test("skips exact duplicate candidates", () => {
    const store = new SQLiteStore(":memory:");
    const service = new MemoryService(store);

    store.addMemoryItem({
      userId: "user_1",
      agentId: "zhuge_liang",
      type: "project_goal",
      content: "The user wants this project to gain 500 stars.",
      importance: 5,
    });

    const result = service.applyCandidates("user_1", "zhuge_liang", [
      {
        type: "project_goal",
        content: "The user wants this project to gain 500 stars.",
        confidence: 0.95,
        importance: 5,
      },
    ]);

    expect(result.summary.skipped).toBe(1);
    expect(result.applied[0]).toMatchObject({
      candidateIndex: 0,
      action: "skip_duplicate",
    });
    expect(store.listMemoryItems("user_1", "zhuge_liang")).toHaveLength(1);
  });

  test("updates a similar same-type memory instead of inserting a duplicate", () => {
    const store = new SQLiteStore(":memory:");
    const service = new MemoryService(store);

    store.addMemoryItem({
      userId: "user_1",
      agentId: "zhuge_liang",
      type: "project_goal",
      content: "The user wants this project to become a compelling open-source demo.",
      importance: 4,
    });

    const result = service.applyCandidates("user_1", "zhuge_liang", [
      {
        type: "project_goal",
        content: "The user wants this project to become a compelling open-source demo and reach 500 stars.",
        confidence: 0.96,
        importance: 5,
      },
    ]);

    expect(result.summary.updated).toBe(1);
    expect(result.applied[0]).toMatchObject({
      candidateIndex: 0,
      action: "update",
    });
    const memories = store.listMemoryItems("user_1", "zhuge_liang");
    expect(memories).toHaveLength(1);
    expect(memories[0]?.content).toContain("500 stars");
    expect(memories[0]?.importance).toBe(5);
  });

  test("inserts new useful candidates", () => {
    const store = new SQLiteStore(":memory:");
    const service = new MemoryService(store);

    const result = service.applyCandidates("user_1", "zhuge_liang", [
      {
        type: "user_preference",
        content: "The user prefers architecture before implementation details.",
        confidence: 0.92,
        importance: 4,
      },
    ]);

    expect(result.summary.inserted).toBe(1);
    expect(result.applied[0]).toMatchObject({
      candidateIndex: 0,
      action: "insert",
    });
    expect(store.listMemoryItems("user_1", "zhuge_liang")).toHaveLength(1);
  });
});
