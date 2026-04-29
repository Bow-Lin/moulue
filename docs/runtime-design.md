# Runtime Design

## Runtime Goal

`CharacterChatAgent` is the runtime entry point for one in-character chat turn.

Its job is to orchestrate the current request cleanly and explicitly, without absorbing every policy and storage detail into one large object.

## CharacterChatAgent Responsibilities

Current responsibilities:

- load the selected profile
- rely on the validated schema v1 profile shape
- resolve or create the session
- load session context
- assemble prompt sections in fixed order
- call the configured provider
- persist the turn
- invoke post-reply hooks
- return the reply and optional debug trace

It acts as the orchestration layer for one chat turn, not as a generic workflow engine.

## Reply Lifecycle

Current reply lifecycle:

1. resolve `sessionId`
2. load and validate the selected schema v1 profile
3. load memory context:
   - long-term memory
   - session summary
4. load recent session messages
5. assemble the system prompt
6. call the provider through the `ChatModel` interface
7. persist the user message
8. persist the assistant reply
9. update the session summary
10. extract long-term memory candidates
11. apply memory candidates
12. return the reply and optional debug trace

Current prompt sections are assembled as:

- `Identity`
- `Background`
- `Core values`
- `Goals`
- `Personality`
- `Decision policy`
- `Relationships`
- `Speaking style`
- `Speech constraints`
- `Response policy`
- `Long-term memory`
- `Session summary`
- `Recent conversation`

## Session Handling

Current behavior:

- if `sessionId` is absent, create a new session
- if `sessionId` is present, validate that it belongs to the same `userId` and `agentId`
- if validation fails, return a session error through the route layer

This keeps session continuity explicit and prevents silent session mixing.

## Profile Validation

Current loader behavior:

- resolves `agentId -> profiles/{agentId}.yaml`
- validates `agentId` format before file access
- requires `schema_version: 1`
- requires the schema v1 core sections to exist
- rejects profiles whose `agent_id` does not match the requested `agentId`

This keeps profile loading convention-based without letting runtime prompts drift away from the selected character.

## Summary Update

Summary update is delegated to `SessionSummarizer`.

Current behavior:

- load all stored messages for the session
- if the session does not exceed the threshold, do nothing
- otherwise fold older messages into a new summary
- persist the new summary back to the session record

`CharacterChatAgent` decides when to call the summarizer, but the summarizer owns the summary-generation logic.

## Memory Extraction Hook

Long-term memory extraction is a post-reply hook.

Current flow:

1. load a brief recent slice of the conversation
2. load a brief existing memory context
3. run `MemoryExtractor`
4. pass candidates to `MemoryService`
5. persist memory changes through `SQLiteStore`

This keeps extraction and memory-application policy outside the core reply generation step.

## Boundaries

`CharacterChatAgent` should own:

- orchestration of one chat turn
- prompt assembly order
- provider invocation timing
- persistence ordering
- debug trace assembly

`CharacterChatAgent` should not own:

- complex memory conflict resolution
- vector retrieval
- provider-specific API details
- profile authoring policy beyond lightweight runtime validation
- frontend or UI logic
- multi-agent coordination
- speculative world-state logic

Supporting modules should stay explicit:

- `MemoryManager` for reading reply-time memory context
- `SessionSummarizer` for summary generation
- `MemoryExtractor` for candidate generation
- `MemoryService` for candidate application
- `SQLiteStore` for persistence
- `AgentFactory` for construction and provider selection
