# Character Chat MVP Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a minimal but usable Zhuge Liang chat MVP with Bun, TypeScript, `Bun.serve`, and `bun:sqlite`, exposed through a local `POST /chat` endpoint.

**Architecture:** Build a thin HTTP transport layer over an explicit chat runtime centered on character profile loading, SQLite-backed persistence, deterministic memory handling, section-aware prompt assembly, and a provider-agnostic chat model contract. Keep the runtime testable by using Bun test and fake model implementations for deterministic orchestration coverage.

**Tech Stack:** Bun, TypeScript, `Bun.serve`, `bun:sqlite`, YAML, Bun test, OpenAI-compatible chat client behind an interface

---

### Task 1: Bootstrap the Bun and TypeScript project with Bun test

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `src/index.ts`
- Create: `tests/unit/imports.test.ts`

**Step 1: Write the failing test**

```ts
import { describe, expect, test } from "bun:test";

describe("package imports", () => {
  test("imports the root entry", async () => {
    const mod = await import("../../src/index");
    expect(mod).toBeDefined();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `bun test tests/unit/imports.test.ts`
Expected: FAIL with module-not-found for `src/index`

**Step 3: Write minimal implementation**

```json
{
  "name": "character-chat",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "bun run src/app/server.ts",
    "test": "bun test"
  }
}
```

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "verbatimModuleSyntax": true
  }
}
```

```ts
export const appName = "character-chat";
```

**Step 4: Run test to verify it passes**

Run: `bun test tests/unit/imports.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add package.json tsconfig.json src/index.ts tests/unit/imports.test.ts
git commit -m "chore: bootstrap bun typescript project"
```

### Task 2: Add the Zhuge Liang profile model and loader

**Files:**
- Create: `src/types/agent.ts`
- Create: `src/agents/profile.ts`
- Create: `src/agents/profiles/loader.ts`
- Create: `src/agents/profiles/zhuge_liang.yaml`
- Create: `tests/unit/agents/profile-loader.test.ts`

**Step 1: Write the failing test**

```ts
import { describe, expect, test } from "bun:test";
import { loadProfile } from "../../../src/agents/profiles/loader";

describe("loadProfile", () => {
  test("loads zhuge liang profile", async () => {
    const profile = await loadProfile("zhuge_liang");
    expect(profile.agentId).toBe("zhuge_liang");
    expect(profile.name).toBe("Zhuge Liang");
    expect(profile.faction).toBe("Shu");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `bun test tests/unit/agents/profile-loader.test.ts`
Expected: FAIL with missing loader module

**Step 3: Write minimal implementation**

```ts
export type AgentProfile = {
  agentId: string;
  name: string;
  faction: string;
  backgroundSummary: string;
  coreValues: string[];
  styleRules: string[];
  speechConstraints: string[];
};
```

Write `loadProfile()` to read `zhuge_liang.yaml` and map the asset into the `AgentProfile` shape. Keep the YAML limited to stable character-definition fields only.

**Step 4: Run test to verify it passes**

Run: `bun test tests/unit/agents/profile-loader.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/types/agent.ts src/agents/profile.ts src/agents/profiles tests/unit/agents/profile-loader.test.ts
git commit -m "feat: add zhuge liang profile loader"
```

### Task 3: Implement SQLite session and message persistence with `bun:sqlite`

**Files:**
- Create: `src/storage/sqlite-store.ts`
- Create: `src/types/chat.ts`
- Create: `tests/unit/storage/sqlite-store.test.ts`

**Step 1: Write the failing test**

```ts
import { describe, expect, test } from "bun:test";
import { SQLiteStore } from "../../../src/storage/sqlite-store";

describe("SQLiteStore", () => {
  test("creates a session and returns recent messages in chronological order", () => {
    const store = new SQLiteStore(":memory:");
    const sessionId = store.createSession("user_1", "zhuge_liang");
    store.appendMessage(sessionId, "user", "How should I govern myself?");
    store.appendMessage(sessionId, "assistant", "First govern your own heart.");
    const messages = store.getRecentMessages(sessionId, 2);
    expect(messages.map((message) => message.role)).toEqual(["user", "assistant"]);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `bun test tests/unit/storage/sqlite-store.test.ts`
Expected: FAIL with missing store module

**Step 3: Write minimal implementation**

Implement `SQLiteStore` with `bun:sqlite` and only the tables needed now:

- `sessions`
- `messages`

Include methods such as:

- `createSession`
- `appendMessage`
- `getRecentMessages`
- `getSession`

Do not add summary tables or speculative metadata columns.

**Step 4: Run test to verify it passes**

Run: `bun test tests/unit/storage/sqlite-store.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/storage/sqlite-store.ts src/types/chat.ts tests/unit/storage/sqlite-store.test.ts
git commit -m "feat: add bun sqlite conversation persistence"
```

### Task 4: Implement short-term memory primitives and impression storage

**Files:**
- Create: `src/types/memory.ts`
- Create: `src/memory/short-term.ts`
- Create: `src/memory/impressions.ts`
- Create: `src/memory/manager.ts`
- Modify: `src/storage/sqlite-store.ts`
- Create: `tests/unit/memory/short-term.test.ts`
- Create: `tests/unit/memory/impressions.test.ts`

**Step 1: Write the failing tests**

```ts
import { describe, expect, test } from "bun:test";
import { buildRecentContext } from "../../../src/memory/short-term";

describe("buildRecentContext", () => {
  test("keeps the latest messages deterministically", () => {
    const messages = [
      { role: "user", content: "1" },
      { role: "assistant", content: "2" },
      { role: "user", content: "3" },
    ];
    const context = buildRecentContext(messages, 2);
    expect(context.map((message) => message.content)).toEqual(["2", "3"]);
  });
});
```

```ts
import { describe, expect, test } from "bun:test";
import { SQLiteStore } from "../../../src/storage/sqlite-store";

describe("impression persistence", () => {
  test("stores impression memory scoped by user and agent", () => {
    const store = new SQLiteStore(":memory:");
    store.upsertImpression({
      userId: "user_1",
      agentId: "zhuge_liang",
      trustLevel: "cautious_respect",
      interactionTags: ["asks_strategy"],
      notableSummary: "The user prefers reflective questions.",
    });
    const memory = store.getImpression("user_1", "zhuge_liang");
    expect(memory?.trustLevel).toBe("cautious_respect");
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `bun test tests/unit/memory/short-term.test.ts tests/unit/memory/impressions.test.ts`
Expected: FAIL with missing memory modules or methods

**Step 3: Write minimal implementation**

Implement:

- `buildRecentContext(messages, maxMessages)`
- impression row persistence in `SQLiteStore`
- a small `MemoryManager` wrapper around recent-message reads and impression reads

Limit impression fields to:

- `trustLevel`
- `interactionTags`
- `notableSummary`

**Step 4: Run tests to verify they pass**

Run: `bun test tests/unit/memory/short-term.test.ts tests/unit/memory/impressions.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/types/memory.ts src/memory src/storage/sqlite-store.ts tests/unit/memory
git commit -m "feat: add short term and impression persistence"
```

### Task 5: Add a minimal deterministic impression update policy

**Files:**
- Create: `src/memory/policy.ts`
- Create: `tests/unit/memory/policy.test.ts`

**Step 1: Write the failing test**

```ts
import { describe, expect, test } from "bun:test";
import { updateImpressionMemory } from "../../../src/memory/policy";

describe("updateImpressionMemory", () => {
  test("creates a baseline impression on first interaction", () => {
    const memory = updateImpressionMemory(undefined, "How should I discipline myself?", "Begin with restraint.");
    expect(memory.trustLevel).toBe("neutral");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `bun test tests/unit/memory/policy.test.ts`
Expected: FAIL with missing policy module

**Step 3: Write minimal implementation**

Implement the smallest rule-based policy that:

- initializes missing impression memory with a neutral default
- adds basic tags without duplicating them endlessly
- optionally updates `notableSummary` only through narrow deterministic rules

Do not use the LLM to generate long-lived impression memory in this MVP.

**Step 4: Run test to verify it passes**

Run: `bun test tests/unit/memory/policy.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/memory/policy.ts tests/unit/memory/policy.test.ts
git commit -m "feat: add deterministic impression policy"
```

### Task 6: Implement section-aware prompt assembly and the provider-agnostic model contract

**Files:**
- Create: `src/prompting/assembler.ts`
- Create: `src/llm/client.ts`
- Create: `tests/unit/prompting/assembler.test.ts`
- Create: `tests/unit/llm/client-contract.test.ts`

**Step 1: Write the failing tests**

```ts
import { describe, expect, test } from "bun:test";
import { assemblePromptSections } from "../../../src/prompting/assembler";

describe("assemblePromptSections", () => {
  test("orders identity, style, memory, recent conversation, and latest message", () => {
    const sections = assemblePromptSections({
      profile: {
        agentId: "zhuge_liang",
        name: "Zhuge Liang",
        faction: "Shu",
        backgroundSummary: "Strategist",
        coreValues: ["duty"],
        styleRules: ["Speak with restraint."],
        speechConstraints: ["Avoid generic assistant language."],
      },
      impressionMemory: { trustLevel: "neutral", interactionTags: [], notableSummary: "" },
      recentMessages: [{ role: "user", content: "Advise me." }],
      userMessage: "How should I lead?",
    });
    expect(Object.keys(sections)).toEqual([
      "PROFILE",
      "STYLE",
      "IMPRESSION MEMORY",
      "RECENT CONVERSATION",
      "LATEST USER MESSAGE",
    ]);
  });
});
```

```ts
import { describe, expect, test } from "bun:test";
import { type ChatRequest } from "../../../src/llm/client";

describe("ChatRequest", () => {
  test("keeps the system prompt and latest user message", () => {
    const request: ChatRequest = { systemPrompt: "profile", userMessage: "question" };
    expect(request.systemPrompt).toBe("profile");
    expect(request.userMessage).toBe("question");
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `bun test tests/unit/prompting/assembler.test.ts tests/unit/llm/client-contract.test.ts`
Expected: FAIL with missing modules

**Step 3: Write minimal implementation**

Implement:

- `assemblePromptSections()`
- `renderPrompt()`
- a provider-agnostic `ChatModel` contract
- a `ChatRequest` type

Task 6 should stop at explicit prompt construction and the provider-agnostic model contract. Do not stitch together runtime orchestration here.

**Step 4: Run tests to verify they pass**

Run: `bun test tests/unit/prompting/assembler.test.ts tests/unit/llm/client-contract.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/prompting/assembler.ts src/llm/client.ts tests/unit/prompting/assembler.test.ts tests/unit/llm/client-contract.test.ts
git commit -m "feat: add prompt assembly and model contract"
```

### Task 7: Implement `CharacterChatAgent` runtime orchestration

**Files:**
- Create: `src/agents/base.ts`
- Create: `src/agents/factory.ts`
- Create: `tests/unit/agents/chat-agent.test.ts`

**Step 1: Write the failing test**

```ts
import { describe, expect, test } from "bun:test";
import { buildAgent } from "../../../src/agents/factory";

class FakeChatModel {
  complete() {
    return "To govern others, first govern yourself.";
  }
}

describe("CharacterChatAgent", () => {
  test("returns a reply, persists a full turn, and updates impression memory", async () => {
    const agent = await buildAgent({
      agentId: "zhuge_liang",
      dbPath: ":memory:",
      chatModel: new FakeChatModel(),
    });
    const sessionId = agent.conversationStore.createSession("user_1", "zhuge_liang");
    const reply = await agent.reply({
      userId: "user_1",
      sessionId,
      userMessage: "How should I discipline myself?",
    });
    expect(reply).toContain("govern yourself");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `bun test tests/unit/agents/chat-agent.test.ts`
Expected: FAIL with missing agent runtime

**Step 3: Write minimal implementation**

Implement the first full orchestration flow:

1. load recent messages
2. load impression memory
3. assemble prompt sections
4. call the chat model
5. persist the current user message
6. persist the assistant reply
7. apply the impression update policy

The current user message must remain separate from `RECENT CONVERSATION` and appear only as `LATEST USER MESSAGE`.

Persist the user and assistant messages only after the model call succeeds so each stored turn remains complete and half-written interactions are avoided.

Task 7 is the first task allowed to stitch together profile, memory, prompting, persistence, and model calls into one turn.

**Step 4: Run test to verify it passes**

Run: `bun test tests/unit/agents/chat-agent.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/agents/base.ts src/agents/factory.ts tests/unit/agents/chat-agent.test.ts
git commit -m "feat: add character chat runtime orchestration"
```

### Task 8: Add the `POST /chat` HTTP API with `Bun.serve`

**Files:**
- Create: `src/app/server.ts`
- Create: `src/app/routes/chat.ts`
- Create: `tests/integration/chat-route.test.ts`

**Step 1: Write the failing integration tests**

```ts
import { describe, expect, test } from "bun:test";
import { createServer } from "../../src/app/server";

describe("POST /chat", () => {
  test("returns a reply for the happy path", async () => {
    const server = createServer({ dbPath: ":memory:" });
    const response = await server.fetch(
      new Request("http://localhost/chat", {
        method: "POST",
        body: JSON.stringify({
          agentId: "zhuge_liang",
          userId: "demo_user",
          message: "How should I cultivate patience?",
        }),
        headers: { "content-type": "application/json" },
      }),
    );
    expect(response.status).toBe(200);
  });
});
```

Add additional integration tests for:

- missing required fields
- unknown `agentId`
- continuing with an existing `sessionId`
- invalid or mismatched `sessionId`

**Step 2: Run tests to verify they fail**

Run: `bun test tests/integration/chat-route.test.ts`
Expected: FAIL with missing server or route modules

**Step 3: Write minimal implementation**

Implement:

- `createServer()`
- `POST /chat`
- minimal request validation
- response payload `{ sessionId, reply, agentId }`

Keep `routes/chat.ts` thin. Do not place prompt logic, memory policy, or character orchestration in the route handler.

**Step 4: Run tests to verify they pass**

Run: `bun test tests/integration/chat-route.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/app/server.ts src/app/routes/chat.ts tests/integration/chat-route.test.ts
git commit -m "feat: add bun serve chat endpoint"
```

### Task 9: Add the real provider wiring and manual MVP smoke test notes

**Files:**
- Modify: `src/llm/client.ts`
- Create: `tests/unit/llm/openai-client.test.ts`
- Modify: `CURRENT.md`

**Step 1: Write the failing test**

```ts
import { describe, expect, test } from "bun:test";
import { OpenAICompatibleChatModel } from "../../../src/llm/client";

describe("OpenAICompatibleChatModel", () => {
  test("builds an OpenAI-compatible payload", () => {
    const client = new OpenAICompatibleChatModel({
      modelName: "gpt-4o-mini",
      apiKey: "test-key",
      baseUrl: "https://api.openai.com/v1",
    });
    const payload = client.buildPayload({
      systemPrompt: "profile",
      userMessage: "question",
    });
    expect(payload.model).toBe("gpt-4o-mini");
    expect(payload.messages[0].role).toBe("system");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `bun test tests/unit/llm/openai-client.test.ts`
Expected: FAIL with missing client implementation

**Step 3: Write minimal implementation**

Implement the smallest provider-backed client needed for first live use. Keep the unit tests network-free.

Update `CURRENT.md` only with a short manual smoke test note for first live use.

**Step 4: Run tests to verify they pass**

Run: `bun test tests/unit/llm/openai-client.test.ts`
Expected: PASS

Run: `bun test`
Expected: PASS

Manual MVP smoke test:

1. start the Bun service
2. call `POST /chat`
3. confirm a non-empty in-character reply
4. confirm session, message, and impression data are written to SQLite
5. reuse the returned `sessionId` in a second `POST /chat` call
6. confirm the conversation continues rather than behaving like a fresh session

**Step 5: Commit**

```bash
git add src/llm/client.ts tests/unit/llm/openai-client.test.ts CURRENT.md
git commit -m "feat: add provider backed llm client for bun mvp"
```
