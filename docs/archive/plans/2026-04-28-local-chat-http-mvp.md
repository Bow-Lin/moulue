# Local Chat HTTP MVP Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a locally runnable `POST /chat` MVP for Zhuge Liang with session continuity, SQLite persistence, and a switchable fake/real chat model.

**Architecture:** Add a thin Bun HTTP layer over an explicit chat runtime. Keep request validation and HTTP response mapping in the route, while profile loading, prompt assembly, session validation, model invocation, and turn persistence live in the runtime layer.

**Tech Stack:** Bun, TypeScript, `Bun.serve`, `bun:sqlite`, YAML, Bun test

---

### Task 1: Add a failing integration test for the `POST /chat` happy path

**Files:**
- Create: `tests/integration/chat-route.test.ts`
- Create: `src/app/server.ts`

**Step 1: Write the failing test**

```ts
import { describe, expect, test } from "bun:test";
import { createServer } from "../../src/app/server";

describe("POST /chat", () => {
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
});
```

**Step 2: Run test to verify it fails**

Run: `bun test tests/integration/chat-route.test.ts`
Expected: FAIL with missing `src/app/server.ts` or missing `createServer`

**Step 3: Write minimal implementation**

Create a placeholder `createServer()` that exposes a `fetch()` function returning a non-200 placeholder response. Do not implement route logic yet.

**Step 4: Run test to verify it still fails for the expected reason**

Run: `bun test tests/integration/chat-route.test.ts`
Expected: FAIL because the route does not yet return `200`

**Step 5: Commit**

```bash
git add tests/integration/chat-route.test.ts src/app/server.ts
git commit -m "test: add initial chat route integration test"
```

### Task 2: Add runtime and model tests for deterministic local replies

**Files:**
- Create: `tests/unit/agents/chat-agent.test.ts`
- Create: `tests/unit/llm/openai-client.test.ts`
- Create: `src/llm/types.ts`
- Create: `src/llm/fake-chat-model.ts`
- Create: `src/llm/openai-client.ts`
- Create: `src/agents/base.ts`

**Step 1: Write the failing tests**

```ts
import { describe, expect, test } from "bun:test";
import { SQLiteStore } from "../../../src/storage/sqlite-store";
import { CharacterChatAgent } from "../../../src/agents/base";
import { FakeChatModel } from "../../../src/llm/fake-chat-model";

describe("CharacterChatAgent", () => {
  test("returns a reply and persists a full turn", async () => {
    const store = new SQLiteStore(":memory:");
    const agent = await CharacterChatAgent.create({
      agentId: "zhuge_liang",
      store,
      chatModel: new FakeChatModel(),
    });

    const result = await agent.reply({
      userId: "user_1",
      message: "How should I steady my heart?",
    });

    expect(result.reply.length).toBeGreaterThan(0);
    expect(typeof result.sessionId).toBe("string");
    expect(store.getRecentMessages(result.sessionId, 2).length).toBe(2);
  });
});
```

```ts
import { describe, expect, test } from "bun:test";
import { OpenAICompatibleChatModel } from "../../../src/llm/openai-client";

describe("OpenAICompatibleChatModel", () => {
  test("builds an OpenAI-compatible payload", () => {
    const client = new OpenAICompatibleChatModel({
      apiKey: "test-key",
      baseUrl: "https://api.openai.com/v1",
      modelName: "gpt-4o-mini",
    });

    const payload = client.buildPayload({
      systemPrompt: "profile",
      userMessage: "question",
    });

    expect(payload.model).toBe("gpt-4o-mini");
    expect(payload.messages[0].role).toBe("system");
    expect(payload.messages[1].role).toBe("user");
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `bun test tests/unit/agents/chat-agent.test.ts tests/unit/llm/openai-client.test.ts`
Expected: FAIL with missing runtime or client modules

**Step 3: Write minimal implementation**

Implement:

- a `ChatModel` interface
- a deterministic `FakeChatModel`
- an `OpenAICompatibleChatModel` with a network-free `buildPayload()`
- a `CharacterChatAgent` orchestration path that:
  - loads the profile
  - creates a session when needed
  - loads recent messages
  - assembles a prompt
  - generates a reply
  - persists both sides of the turn

**Step 4: Run tests to verify they pass**

Run: `bun test tests/unit/agents/chat-agent.test.ts tests/unit/llm/openai-client.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add tests/unit/agents/chat-agent.test.ts tests/unit/llm/openai-client.test.ts src/llm src/agents/base.ts
git commit -m "feat: add local chat runtime and model adapters"
```

### Task 3: Add the HTTP route, validation, and session handling

**Files:**
- Modify: `src/app/server.ts`
- Create: `src/app/routes/chat.ts`
- Create: `src/agents/factory.ts`
- Modify: `tests/integration/chat-route.test.ts`

**Step 1: Expand the failing integration tests**

Add tests for:

- missing required fields returns `400`
- unknown `agentId` returns `404`
- continuing with an existing `sessionId` returns `200`
- invalid or mismatched `sessionId` returns `400`

Example continuation test:

```ts
test("continues an existing session", async () => {
  const server = createServer({ dbPath: ":memory:" });

  const first = await server.fetch(new Request("http://localhost/chat", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      agentId: "zhuge_liang",
      userId: "demo_user",
      message: "Teach me restraint.",
    }),
  }));

  const firstBody = await first.json();

  const second = await server.fetch(new Request("http://localhost/chat", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      agentId: "zhuge_liang",
      userId: "demo_user",
      sessionId: firstBody.sessionId,
      message: "And how should I begin?",
    }),
  }));

  expect(second.status).toBe(200);
});
```

**Step 2: Run tests to verify they fail**

Run: `bun test tests/integration/chat-route.test.ts`
Expected: FAIL because validation and session logic are incomplete

**Step 3: Write minimal implementation**

Implement:

- request parsing and required-field validation
- known error types for `unknown agent` and `invalid session`
- `POST /chat` route handler
- a small agent factory that selects fake vs real model from environment

Keep the route thin. The handler should delegate the actual chat flow to the runtime.

**Step 4: Run tests to verify they pass**

Run: `bun test tests/integration/chat-route.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/app/server.ts src/app/routes/chat.ts src/agents/factory.ts tests/integration/chat-route.test.ts
git commit -m "feat: add bun chat endpoint and validation"
```

### Task 4: Add server startup entrypoint and verify the full suite

**Files:**
- Modify: `src/app/server.ts`
- Modify: `package.json`
- Modify: `tests/integration/chat-route.test.ts`

**Step 1: Add a failing startup assertion**

Add a test that imports `createServer()` and confirms the server object exposes a callable `fetch`.

```ts
test("creates a fetch-capable server", () => {
  const server = createServer({ dbPath: ":memory:" });
  expect(typeof server.fetch).toBe("function");
});
```

**Step 2: Run tests to verify the current shape**

Run: `bun test tests/integration/chat-route.test.ts`
Expected: PASS or targeted failure if startup wiring is missing

**Step 3: Write minimal implementation**

Ensure:

- `src/app/server.ts` exports `createServer()`
- direct execution starts `Bun.serve`
- `package.json` keeps `bun run src/app/server.ts` as the dev entrypoint

**Step 4: Run verification**

Run: `bun test`
Expected: PASS

Run: `bun run dev`
Expected: service starts successfully and logs the local port

**Step 5: Commit**

```bash
git add src/app/server.ts package.json tests/integration/chat-route.test.ts
git commit -m "feat: start local chat http mvp"
```

### Task 5: Record manual smoke-test steps for local validation

**Files:**
- Modify: `CURRENT.md`

**Step 1: Add a short smoke-test note**

Document the local verification flow:

1. start the server with `bun run dev`
2. call `POST /chat` without `sessionId`
3. reuse the returned `sessionId` in a second request
4. verify a non-empty reply and stored continuity

**Step 2: Run the full test suite again**

Run: `bun test`
Expected: PASS

**Step 3: Commit**

```bash
git add CURRENT.md
git commit -m "docs: record local chat mvp smoke test"
```
