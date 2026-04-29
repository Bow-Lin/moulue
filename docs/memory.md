# Memory

## Goal

Memory exists to improve **continuity** without turning the system into a retrieval-heavy knowledge platform.

Current memory is not a vector memory system. It is a layered design built from:

- SQLite stored long-term memory
- session summary
- recent messages

## Memory Layers

### Long-Term Memory

Purpose:

- preserve durable user-specific context across sessions
- let future replies reflect stable goals, preferences, and constraints

Storage:

- persisted in SQLite `memory_items`
- keyed by `user_id` and `agent_id`

### Session Summary

Purpose:

- compress older session context when the full session grows beyond the recent-message window
- preserve decisions, constraints, and unresolved questions from the current session

Current behavior:

- recent window size: `8` messages
- summary trigger threshold: more than `12` total messages
- older messages are folded into a single summary string

### Recent Messages

Purpose:

- preserve short-term continuity
- keep immediate turn-to-turn context explicit in the prompt

Current behavior:

- the reply prompt includes the most recent `8` stored messages

## Long-Term Memory Types

Current stored memory types:

- `user_preference`
- `project`
- `project_goal`
- `fact`
- `style`
- `constraint`
- `relationship`

These types are meant to be small, durable categories. They are not intended to store raw transcript fragments.

## Extraction Flow

Current behavior after a successful chat turn:

1. persist the user message and assistant reply
2. update the session summary if needed
3. run the memory extractor
4. apply extracted candidates to long-term memory

Current extractor inputs:

- `agentId`
- `userId`
- `sessionId`
- up to the latest `6` messages
- a brief slice of existing long-term memory

Current extractor output:

- `ran`
- `candidates`
- optional `rawText`
- optional `parseError`

The extractor runs after every successful turn and may return `[]` when nothing is worth saving.

## Apply Policy

Current apply policy is intentionally lightweight.

Implemented actions:

- `insert`
- `update`
- `skip_duplicate`
- `discard_low_confidence`

Current rules:

- discard candidates below the confidence threshold
- skip exact duplicates
- update a similar same-type memory instead of inserting a near-duplicate
- insert new useful candidates

Current implementation does **not** yet apply:

- low-importance discard
- invalid-candidate discard as a first-class stored action
- advanced conflict resolution
- forgetting or deletion policies

## Injection Order

Current prompt injection order is:

1. long-term memory
2. session summary
3. recent messages

This is a layered memory design, not a retrieval ranking system.

Memory is injected after the richer character profile sections. It can personalize or continue the conversation, but it should not overwrite profile-defined goals, decision policy, relationships, or speaking style.

## Debug Trace

Current `/chat` debug output is split into:

- `beforeReply`
- `afterReply`

`beforeReply` shows:

- provider
- long-term memories used
- whether a session summary was present
- recent-message count
- optional full prompt

`afterReply.extraction` shows:

- whether extraction ran
- extracted candidates
- apply results
- optional raw extractor output
- optional parse error

This trace exists to make memory behavior observable instead of opaque.

## Limitations

Current limitations:

- no vector search
- no BM25 retrieval
- no QMD integration
- no memory deletion flow
- no richer conflict resolution
- no explicit memory quality evaluation loop
- session summary is still a plain summary string, not a structured state object

## Future Work

Possible future work:

- stronger conflict resolution and merge policies
- explicit forgetting and deletion
- low-importance filtering
- structured session summaries
- BM25 retrieval
- embedding-based retrieval
- QMD-style local memory search
- memory evaluation and regression testing
