# Three-Layer Memory Design

**Date:** 2026-04-29

## Goal

Add a first usable three-layer memory shape for the character chat runtime:

- short-term memory from recent messages
- medium-term memory from per-session summaries
- long-term memory from durable user-agent memory items

## Scope

This version adds:

- `sessions.summary`
- `memory_items`
- prompt injection for long-term memory and session summary
- deterministic summary updates after message persistence

This version does not add:

- automatic long-term memory extraction
- memory conflict resolution
- vector retrieval
- BM25 retrieval
- token-based dynamic truncation

## Memory Layers

### Short-Term

Use the most recent `8` messages from the current session.

Purpose:

- preserve local continuity
- keep recent references verbatim

### Medium-Term

Use a per-session `summary` string stored on the session record.

Purpose:

- preserve older session context when recent-message windows are limited
- carry forward decisions, local goals, and active constraints from the current conversation

Update policy:

- trigger only when total session message count exceeds `12`
- summarize all but the latest `8` messages
- use the old summary plus the foldable older messages to produce a new summary
- overwrite the stored summary instead of appending indefinitely

### Long-Term

Use `memory_items` stored by `user_id + agent_id`.

Purpose:

- preserve stable user preferences
- preserve recurring project context
- preserve durable facts or style expectations

This version only supports reading and injecting those items. Automatic extraction is deferred.

## Data Model

### `sessions`

Add:

- `summary TEXT`

### `memory_items`

Store:

- `id`
- `user_id`
- `agent_id`
- `type`
- `content`
- `importance`
- `created_at`
- `updated_at`

Allowed memory types for this version:

- `preference`
- `project`
- `fact`
- `style`

## Prompt Order

Each reply should assemble prompt context in this order:

1. character profile
2. style and speech constraints
3. long-term memories
4. session summary
5. recent messages
6. latest user message

Character identity remains the strongest authority. Memory informs the reply but does not override the profile.

## Summary Boundary

Session summary must not absorb long-term user preferences by default.

Good session-summary content:

- what the user is trying to do in this conversation
- local decisions already made
- constraints established in this session
- unresolved questions still active in this session

Good long-term-memory content:

- stable response preferences
- recurring project background
- durable user facts likely to matter across sessions

## Write Timing

Per reply:

1. load long-term memory
2. load session summary
3. load recent messages
4. build the prompt
5. call the chat model
6. persist the new user and assistant messages
7. update the session summary if the threshold is crossed

Long-term memory writes are not automated in this version.

## Acceptance

This version is acceptable when:

- old session context can survive beyond the recent-message window through `sessions.summary`
- manually inserted long-term memory appears in prompt assembly
- repeated sessions can load user-agent memory items
- existing chat route behavior remains stable
