# Provider Env Config Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add `.env.local` support and configurable LLM provider selection for `fake`, `glm`, and `bailian`.

**Architecture:** Keep environment loading in a small config module and keep provider selection inside the agent factory. Reuse the existing OpenAI-compatible client for both GLM and Bailian, and fall back to the fake model when the selected provider is missing required configuration.

**Tech Stack:** Bun, TypeScript, Bun test

---

### Task 1: Add failing tests for env loading and provider selection

**Files:**
- Create: `tests/unit/config/env.test.ts`
- Modify: `tests/unit/llm/openai-client.test.ts`
- Modify: `tests/unit/agents/chat-agent.test.ts`
- Modify: `src/agents/factory.ts`

**Step 1: Write the failing tests**

Add tests for:

- loading `.env.local` key-value pairs
- preserving existing process env values over `.env.local`
- selecting `fake`
- selecting `glm`
- selecting `bailian`
- falling back to `fake` when selected provider config is incomplete

**Step 2: Run tests to verify they fail**

Run: `bun test tests/unit/config/env.test.ts tests/unit/agents/factory.test.ts`
Expected: FAIL with missing env loader or provider selection helpers

**Step 3: Write minimal implementation**

Implement a small env loader and expose a factory helper that makes provider selection testable without booting the whole server.

**Step 4: Run tests to verify they pass**

Run: `bun test tests/unit/config/env.test.ts tests/unit/agents/factory.test.ts`
Expected: PASS

### Task 2: Wire the selected provider into the runtime

**Files:**
- Create: `src/config/env.ts`
- Modify: `src/agents/factory.ts`

**Step 1: Run the relevant integration test**

Run: `bun test tests/integration/chat-route.test.ts`
Expected: PASS before and after the wiring change

**Step 2: Write minimal implementation**

Load `.env.local` once, parse `LLM_PROVIDER`, and construct either `FakeChatModel` or `OpenAICompatibleChatModel` with the matching provider-specific env values.

**Step 3: Run the relevant tests**

Run: `bun test tests/unit/config/env.test.ts tests/unit/agents/factory.test.ts tests/integration/chat-route.test.ts`
Expected: PASS

### Task 3: Add local config examples and ignore rules

**Files:**
- Create: `.env.example`
- Modify: `.gitignore`

**Step 1: Add the config template**

Include examples for:

- `LLM_PROVIDER=fake`
- `LLM_PROVIDER=glm`
- `LLM_PROVIDER=bailian`

**Step 2: Add ignore rules**

Ensure `.env.local` and runtime SQLite files are ignored.

**Step 3: Run full verification**

Run: `bun test`
Expected: PASS

Run: `bun run dev`
Expected: server starts successfully
