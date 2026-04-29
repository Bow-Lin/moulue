import { beforeEach, describe, expect, test } from "bun:test";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createServer } from "../../src/app/server";
import { SQLiteStore } from "../../src/storage/sqlite-store";

describe("POST /chat", () => {
  beforeEach(() => {
    Bun.env.LLM_PROVIDER = "fake";
    delete Bun.env.BAILIAN_API_KEY;
    delete Bun.env.BAILIAN_BASE_URL;
    delete Bun.env.BAILIAN_MODEL;
    delete Bun.env.GLM_API_KEY;
    delete Bun.env.GLM_BASE_URL;
    delete Bun.env.GLM_MODEL;
  });

  test("creates a fetch-capable server", () => {
    const server = createServer({ dbPath: ":memory:" });
    expect(typeof server.fetch).toBe("function");
  });

  test("returns a reply for a new session", async () => {
    const server = createServer({ dbPath: ":memory:" });
    const response = await server.fetch(
      new Request("http://localhost/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          agentId: "zhuge_liang",
          userId: "demo_user",
          message: "How should I cultivate patience?",
        }),
      }),
    );

    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.agentId).toBe("zhuge_liang");
    expect(typeof body.sessionId).toBe("string");
    expect(body.reply.length).toBeGreaterThan(0);
  });

  test("returns 400 when required fields are missing", async () => {
    const server = createServer({ dbPath: ":memory:" });
    const response = await server.fetch(
      new Request("http://localhost/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          agentId: "zhuge_liang",
          userId: "demo_user",
        }),
      }),
    );

    expect(response.status).toBe(400);
  });

  test("returns 404 for an unknown agent", async () => {
    const server = createServer({ dbPath: ":memory:" });
    const response = await server.fetch(
      new Request("http://localhost/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          agentId: "unknown_agent",
          userId: "demo_user",
          message: "How should I cultivate patience?",
        }),
      }),
    );

    expect(response.status).toBe(404);
  });

  test("returns a reply for cao cao when selected by agentId", async () => {
    const server = createServer({ dbPath: ":memory:" });
    const response = await server.fetch(
      new Request("http://localhost/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          agentId: "cao_cao",
          userId: "demo_user",
          message: "How do you judge Liu Bei?",
          debug: true,
        }),
      }),
    );

    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.agentId).toBe("cao_cao");
    expect(body.debug.beforeReply.agentId).toBe("cao_cao");
  });

  test("continues an existing session", async () => {
    const server = createServer({ dbPath: ":memory:" });
    const first = await server.fetch(
      new Request("http://localhost/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          agentId: "zhuge_liang",
          userId: "demo_user",
          message: "Teach me restraint.",
        }),
      }),
    );

    const firstBody = await first.json();
    const second = await server.fetch(
      new Request("http://localhost/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          agentId: "zhuge_liang",
          userId: "demo_user",
          sessionId: firstBody.sessionId,
          message: "And how should I begin?",
        }),
      }),
    );

    expect(second.status).toBe(200);

    const secondBody = await second.json();
    expect(secondBody.sessionId).toBe(firstBody.sessionId);
    expect(secondBody.reply.length).toBeGreaterThan(0);
  });

  test("returns 400 for a mismatched session", async () => {
    const server = createServer({ dbPath: ":memory:" });
    const first = await server.fetch(
      new Request("http://localhost/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          agentId: "zhuge_liang",
          userId: "demo_user",
          message: "Teach me restraint.",
        }),
      }),
    );

    const firstBody = await first.json();
    const second = await server.fetch(
      new Request("http://localhost/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          agentId: "zhuge_liang",
          userId: "other_user",
          sessionId: firstBody.sessionId,
          message: "Can I continue this session?",
        }),
      }),
    );

    expect(second.status).toBe(400);
  });

  test("stores a long-term memory item through POST /memory/add", async () => {
    const dbDir = mkdtempSync(join(tmpdir(), "character-chat-memory-route-"));
    const dbPath = join(dbDir, "app.sqlite");
    const server = createServer({ dbPath });
    const response = await server.fetch(
      new Request("http://localhost/memory/add", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          userId: "demo_user",
          agentId: "zhuge_liang",
          type: "project",
          content: "The user is building a three-layer memory system.",
          importance: 4,
        }),
      }),
    );

    expect(response.status).toBe(200);

    const store = new SQLiteStore(dbPath);
    const memories = store.listMemoryItems("demo_user", "zhuge_liang");
    expect(memories).toHaveLength(1);
    expect(memories[0]?.type).toBe("project");
  });

  test("stores a project_goal memory item through POST /memory/add", async () => {
    const dbDir = mkdtempSync(join(tmpdir(), "character-chat-memory-route-"));
    const dbPath = join(dbDir, "app.sqlite");
    const server = createServer({ dbPath });
    const response = await server.fetch(
      new Request("http://localhost/memory/add", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          userId: "demo_user",
          agentId: "zhuge_liang",
          type: "project_goal",
          content: "The user wants this project to become a compelling open-source demo.",
          importance: 5,
        }),
      }),
    );

    expect(response.status).toBe(200);

    const store = new SQLiteStore(dbPath);
    const memories = store.listMemoryItems("demo_user", "zhuge_liang");
    expect(memories).toHaveLength(1);
    expect(memories[0]?.type).toBe("project_goal");
  });

  test("returns 400 when /memory/add fields are missing", async () => {
    const server = createServer({ dbPath: ":memory:" });
    const response = await server.fetch(
      new Request("http://localhost/memory/add", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          userId: "demo_user",
          agentId: "zhuge_liang",
          content: "Missing type and importance.",
        }),
      }),
    );

    expect(response.status).toBe(400);
  });

  test("returns 400 when /memory/add type is invalid", async () => {
    const server = createServer({ dbPath: ":memory:" });
    const response = await server.fetch(
      new Request("http://localhost/memory/add", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          userId: "demo_user",
          agentId: "zhuge_liang",
          type: "temporary_mood",
          content: "The user feels tired today.",
          importance: 2,
        }),
      }),
    );

    expect(response.status).toBe(400);
  });

  test("returns lightweight debug trace for /chat", async () => {
    const dbDir = mkdtempSync(join(tmpdir(), "character-chat-debug-route-"));
    const dbPath = join(dbDir, "app.sqlite");
    const server = createServer({ dbPath });

    await server.fetch(
      new Request("http://localhost/memory/add", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          userId: "demo_user",
          agentId: "zhuge_liang",
          type: "user_preference",
          content: "The user prefers architecture before implementation.",
          importance: 4,
        }),
      }),
    );

    const response = await server.fetch(
      new Request("http://localhost/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          agentId: "zhuge_liang",
          userId: "demo_user",
          message: "What should I build first?",
          debug: true,
        }),
      }),
    );

    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.debug.beforeReply.provider).toBe("fake");
    expect(body.debug.beforeReply.prompt.longTermMemoryCount).toBe(1);
    expect(body.debug.beforeReply.prompt.recentMessageCount).toBeGreaterThanOrEqual(0);
    expect(body.debug.beforeReply.memoriesUsed).toHaveLength(1);
    expect(body.debug.beforeReply.memoriesUsed[0]?.type).toBe("user_preference");
    expect(body.debug.beforeReply.memoriesUsed[0]?.preview).toContain("architecture before implementation");
    expect(body.debug.afterReply.extraction.ran).toBe(true);
    expect(body.debug.afterReply.extraction.candidates).toEqual([]);
    expect(body.debug.afterReply.extraction.applied).toEqual([]);
  });

  test("keeps memory isolated between zhuge liang and cao cao", async () => {
    const dbDir = mkdtempSync(join(tmpdir(), "character-chat-agent-isolation-"));
    const dbPath = join(dbDir, "app.sqlite");
    const server = createServer({ dbPath });

    await server.fetch(
      new Request("http://localhost/memory/add", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          userId: "demo_user",
          agentId: "zhuge_liang",
          type: "project_goal",
          content: "The user wants to restore Han legitimacy through careful alliances.",
          importance: 5,
        }),
      }),
    );

    const response = await server.fetch(
      new Request("http://localhost/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          agentId: "cao_cao",
          userId: "demo_user",
          message: "How should I unify the realm?",
          debug: true,
        }),
      }),
    );

    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.debug.beforeReply.prompt.longTermMemoryCount).toBe(0);
    expect(body.debug.beforeReply.memoriesUsed).toEqual([]);
  });

  test("returns full debug details when explicitly requested", async () => {
    const dbDir = mkdtempSync(join(tmpdir(), "character-chat-debug-route-"));
    const dbPath = join(dbDir, "app.sqlite");
    const server = createServer({ dbPath });

    await server.fetch(
      new Request("http://localhost/memory/add", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          userId: "demo_user",
          agentId: "zhuge_liang",
          type: "user_preference",
          content: "The user prefers architecture before implementation.",
          importance: 4,
        }),
      }),
    );

    const response = await server.fetch(
      new Request("http://localhost/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          agentId: "zhuge_liang",
          userId: "demo_user",
          message: "What should I build first?",
          debug: {
            includeMemoryContent: true,
            includePrompt: true,
          },
        }),
      }),
    );

    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.debug.beforeReply.memoriesUsed[0]?.content).toContain("architecture before implementation");
    expect(body.debug.beforeReply.assembledPrompt).toContain("Long-term memory:");
  });
});
