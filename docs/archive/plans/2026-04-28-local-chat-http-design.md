# Local Chat HTTP MVP Design

**Date:** 2026-04-28

## Goal

Provide a locally runnable MVP that exposes a single `POST /chat` endpoint for a Zhuge Liang character chat flow with session continuity and SQLite-backed persistence.

## Scope

This design covers only the minimum runtime needed to validate the MVP locally:

- one HTTP endpoint: `POST /chat`
- one character: `zhuge_liang`
- session creation and continuation
- recent-message continuity through SQLite
- a switchable chat model with a deterministic local default

This design explicitly does not add:

- streaming responses
- multiple routes
- heavy memory systems
- agent orchestration frameworks
- speculative abstractions for future characters

## API Contract

Request body:

```json
{
  "agentId": "zhuge_liang",
  "userId": "demo_user",
  "message": "How should I cultivate patience?",
  "sessionId": "optional-existing-session-id"
}
```

Response body:

```json
{
  "sessionId": "uuid",
  "agentId": "zhuge_liang",
  "reply": "..."
}
```

## Session Rules

- If `sessionId` is omitted, the server creates a new session for the `userId` and `agentId`.
- If `sessionId` is provided, the server must load the session and verify it belongs to the same `userId` and `agentId`.
- A mismatched or missing `sessionId` is a client error and returns `400`.
- The server must not silently create a fresh session when an invalid `sessionId` is supplied.

## Error Mapping

- Invalid JSON or missing required fields: `400`
- Unknown `agentId`: `404`
- Invalid or mismatched `sessionId`: `400`
- Unexpected runtime failure: `500`

## Runtime Structure

The runtime is split into two thin layers:

1. HTTP layer
   - parse JSON
   - validate required fields
   - call the chat runtime
   - convert known errors into HTTP responses

2. Chat runtime
   - load `AgentProfile`
   - create or validate the session
   - load recent conversation messages
   - assemble the prompt in a fixed order
   - call the active chat model
   - persist the full turn

The route handler must remain thin. Prompt construction, persistence sequencing, and model selection belong in the chat runtime.

## Prompt Assembly

Prompt assembly uses a fixed order to preserve character identity:

1. stable character profile
2. style and speech constraints
3. recent conversation
4. latest user message

The current user message remains separate from recent conversation so the latest turn is always explicit.

## Persistence Rules

The runtime reads recent messages from the existing SQLite store and writes both sides of the new turn only after model generation succeeds.

This avoids storing half-finished interactions where a user message exists without a corresponding character reply.

## Chat Model Strategy

The runtime depends on a small `ChatModel` interface.

- Default path: use a deterministic `FakeChatModel`
- Optional path: use an OpenAI-compatible model if required environment variables are present

The local fake model exists to keep the MVP runnable and testable without network access or API credentials. The real model path exists so the runtime shape does not need to change later.

## Testing Strategy

The MVP is considered valid when these checks pass:

- unit tests for runtime orchestration
- unit tests for OpenAI-compatible payload construction
- integration tests for `POST /chat`
- manual smoke test with two requests sharing one `sessionId`

Integration coverage should prove:

- happy-path reply generation
- missing field rejection
- unknown `agentId` rejection
- session continuation with a valid `sessionId`
- rejection for an invalid or mismatched `sessionId`

## Acceptance Criteria

The MVP is acceptable when:

- `bun run dev` starts a local HTTP server
- `POST /chat` returns a non-empty reply
- the response includes a usable `sessionId`
- a second request using the same `sessionId` continues the conversation
- session and message rows are written to SQLite
