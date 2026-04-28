# Bun TypeScript Character Chat MVP Design

## Goal

Define a minimal but believable Zhuge Liang chat MVP implemented with **Bun + TypeScript**, using:

- `Bun.serve` for the local HTTP API
- `bun:sqlite` for persistence
- a small explicit runtime centered on character chat

The product goal is not a generic agent framework. The goal is a narrow loop where the user can repeatedly talk to Zhuge Liang and feel:

- the reply sounds recognizably like Zhuge Liang
- recent conversation context is remembered
- a lightweight user-specific impression persists across sessions

## Chosen Stack

The stack is intentionally minimal:

- Bun runtime
- TypeScript
- `Bun.serve` for HTTP
- `bun:sqlite` for local persistence
- YAML for character profile assets
- Bun test for deterministic unit and integration tests

No framework, ORM, rich UI, vector DB, or autonomous workflow layer is included in this MVP design.

## Architecture

The codebase should be organized around a thin transport layer and an explicit chat runtime:

```text
src/
  app/
    server.ts
    routes/
      chat.ts

  agents/
    base.ts
    factory.ts
    profile.ts
    profiles/
      zhuge_liang.yaml
      loader.ts

  memory/
    short-term.ts
    impressions.ts
    policy.ts
    manager.ts

  storage/
    sqlite-store.ts

  prompting/
    assembler.ts

  llm/
    client.ts

  types/
    agent.ts
    chat.ts
    memory.ts
```

### Module responsibilities

`app/`
- transport only
- `server.ts` owns `Bun.serve` and route registration
- `routes/chat.ts` owns request parsing, minimal validation, and response formatting

`agents/`
- business core
- owns profile loading, runtime orchestration, and agent construction
- should contain the main conversation flow instead of scattering it across route handlers

`memory/`
- keeps short-term memory, durable impression memory, and impression update policy separate
- prevents memory from collapsing into one large opaque subsystem

`storage/sqlite-store.ts`
- acts as a persistence adapter only
- can expose functions such as:
  - `createSession`
  - `appendMessage`
  - `getRecentMessages`
  - `getImpression`
  - `upsertImpression`
- must not own prompt logic, impression policy, session semantics, or agent behavior

`prompting/assembler.ts`
- owns section-aware prompt assembly
- should remain independent because this layer will be iterated often

`llm/client.ts`
- defines a provider-agnostic model contract
- real provider wiring should remain minimal and isolated

`types/`
- `chat.ts` for transport-level request and response shapes
- `memory.ts` for impression and memory types
- `agent.ts` for profile and runtime-facing agent types

### Naming direction

The path can remain `agents/base.ts`, but the main runtime class should lean toward the product domain, for example `CharacterChatAgent`, to avoid sounding like a generic agent platform.

### Character profile assets

`zhuge_liang.yaml` should behave like a product asset, not a runtime dump. The first version should contain stable identity fields such as:

- `name`
- `faction`
- `background_summary`
- `core_values`
- `style_rules`
- `speech_constraints`

Do not overload the profile with technical flags such as memory thresholds, runtime policies, tool flags, or retrieval controls.

## API Design

The MVP should expose one narrow endpoint:

`POST /chat`

### Request body

```json
{
  "agentId": "zhuge_liang",
  "userId": "demo_user",
  "sessionId": "optional-session-id",
  "message": "How should I cultivate patience?"
}
```

### Response body

```json
{
  "sessionId": "session-id",
  "reply": "A measured in-character reply here.",
  "agentId": "zhuge_liang"
}
```

### Excluded from MVP

Do not add:

- streaming
- token usage reporting
- prompt debug output
- session analytics endpoints
- history browsing endpoints
- admin controls

## Runtime Data Flow

One request should follow this flow:

1. `routes/chat.ts` parses the request and performs minimal validation
2. if `sessionId` is absent, the runtime creates a new session
3. the runtime loads the selected character profile
4. the runtime loads recent messages for the session
5. the runtime loads impression memory scoped by `(userId, agentId)`
6. the runtime assembles prompt sections in this order:
   - `PROFILE`
   - `STYLE`
   - `IMPRESSION MEMORY`
   - `RECENT CONVERSATION`
   - `LATEST USER MESSAGE`
7. the runtime calls the model through the provider-agnostic contract
8. after the model succeeds, the runtime persists the user message and assistant reply as one complete turn
9. the runtime applies the impression update policy
10. the route returns `sessionId`, `reply`, and `agentId`

### Important runtime rules

- `RECENT CONVERSATION` should not include the current user input
- the current input should be represented separately as `LATEST USER MESSAGE`
- storage should not infer agent behavior
- routes should not assemble prompts or apply memory policy

### Session mismatch rule

If a provided `sessionId` does not belong to the same `userId` and `agentId`, the API should return a client error rather than silently reusing the session.

## Testing Strategy

### Deterministic unit tests

Prioritize tests for:

- profile loading
- session and message persistence
- short-term message slicing
- impression memory reads and writes
- impression update policy
- prompt section assembly
- runtime orchestration with a fake model

Also keep this explicit boundary concern:

- turn persistence should not leave a half-written user and assistant pair on failure

### Integration tests

Cover at least:

- `POST /chat` happy path
- missing required fields
- unknown `agentId`
- continuing with an existing `sessionId`
- invalid or mismatched `sessionId`

### Manual smoke test

Manual MVP validation should include both the first and second turn:

1. start the local Bun service
2. call `/chat`
3. confirm a non-empty in-character reply
4. confirm session, messages, and impression data are written to SQLite
5. reuse the returned `sessionId` in a second `/chat` call
6. confirm the conversation continues rather than behaving like a fresh session

## Acceptance Phases

### Phase A

- new session
- one user message
- one in-character reply
- messages persisted
- impression initialized or updated

### Phase B

- continue with an existing `sessionId`
- recent context influences reply construction
- impression memory is read on subsequent turns

## Task Boundary Rules

When writing the implementation plan:

- prompt assembly and the provider-agnostic model contract should stop short of runtime orchestration
- runtime orchestration is the first place where profile, memory, prompting, persistence, and model calls may be stitched into one turn
- HTTP API work should come after deterministic runtime behavior is stable

This keeps the MVP implementation narrow, testable, and aligned with the repository's chat-first direction.
