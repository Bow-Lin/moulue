# Three-Layer Memory Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add session summaries and durable long-term memory items so the chat runtime has explicit short-term, medium-term, and long-term memory layers.

**Architecture:** Extend the SQLite store with session summaries and memory items, add a small memory manager layer for retrieval, and update the chat runtime so prompt assembly includes long-term memory and session summary before recent messages. Session summaries are updated deterministically after each persisted turn once the configured threshold is crossed.

**Tech Stack:** Bun, TypeScript, `bun:sqlite`, Bun test

---

### Task 1: Add failing storage tests for session summary and long-term memory

**Files:**
- Modify: `tests/unit/storage/sqlite-store.test.ts`
- Modify: `src/storage/sqlite-store.ts`
- Create: `src/types/memory.ts`

**Step 1: Write the failing tests**

Add tests for:

- updating and reading `sessions.summary`
- inserting and listing `memory_items` for one `userId + agentId`

**Step 2: Run tests to verify they fail**

Run: `bun test tests/unit/storage/sqlite-store.test.ts`
Expected: FAIL with missing methods or schema

**Step 3: Write minimal implementation**

Add:

- `summary` column on `sessions`
- `memory_items` table
- store methods to get/update session summary
- store methods to add/list memory items

**Step 4: Run tests to verify they pass**

Run: `bun test tests/unit/storage/sqlite-store.test.ts`
Expected: PASS

### Task 2: Add failing runtime tests for memory-aware prompt assembly and summary updates

**Files:**
- Modify: `tests/unit/agents/chat-agent.test.ts`
- Create: `src/memory/manager.ts`
- Modify: `src/agents/base.ts`

**Step 1: Write the failing tests**

Add tests for:

- long-term memory appearing in the system prompt
- session summary appearing in the system prompt
- summary updating once a session exceeds `12` messages while still keeping the latest `8` messages recent

**Step 2: Run tests to verify they fail**

Run: `bun test tests/unit/agents/chat-agent.test.ts`
Expected: FAIL with missing memory manager or summary update behavior

**Step 3: Write minimal implementation**

Implement:

- a small `MemoryManager`
- summary-aware prompt assembly
- deterministic summary update after message persistence

Use the existing chat model interface for summary generation so the runtime remains testable with fake models.

**Step 4: Run tests to verify they pass**

Run: `bun test tests/unit/agents/chat-agent.test.ts`
Expected: PASS

### Task 3: Verify route stability and full-suite compatibility

**Files:**
- Modify: `tests/integration/chat-route.test.ts` only if required by behavior changes

**Step 1: Run the integration suite**

Run: `bun test tests/integration/chat-route.test.ts`
Expected: PASS

**Step 2: Run full verification**

Run: `bun test`
Expected: PASS
