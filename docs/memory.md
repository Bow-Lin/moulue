# Memory

## Goal

Memory exists to improve **continuity**, not to hoard every past detail.

The system should preserve enough context to make conversations feel ongoing without flooding prompts with low-value history.

## Memory Types

### Short-Term Conversation Memory

Purpose:

- maintain turn-to-turn continuity
- support references to recent statements
- keep the local scene coherent

Typical contents:

- recent message history
- an optional rolling summary when the raw history grows too large

Rules:

- prefer the smallest useful window
- summarize when necessary instead of passing long transcripts
- avoid mixing in inferred personality judgments that belong in impression memory

### Long-Lived Impression Memory

Purpose:

- make repeated sessions feel personal
- preserve durable impressions about the user-character relationship

Typical contents:

- trust tendency
- recurring user interests
- notable interaction summaries
- persistent impression tags

Rules:

- keep entries lightweight and structured
- write only when something is likely to matter later
- avoid storing trivial one-off details
- update or replace stale impressions instead of endlessly appending noise
- do not persist every conversation detail as durable memory

### Character Profile

This is not runtime memory.

It defines stable identity, such as:

- worldview
- loyalty
- emotional restraint
- strategic preference
- speech habits

Do not mutate the profile during ordinary runtime.

## Suggested Impression Shape

Use a compact structure when possible, for example:

```yaml
user_id: user_123
agent_id: zhuge_liang
trust_level: cautious_respect
interaction_tags:
  - asks_strategic_questions
  - responds_politely
notable_summary: The user prefers reflective discussion over playful banter.
updated_at: 2026-04-28
```

The exact schema can evolve, but it should remain small, readable, and easy to revise.

## Read and Write Timing

Read:

- short-term memory on every reply
- impression memory at the start of each session or reply assembly

Write:

- conversation history after every turn
- impression memory only after meaningful, reusable signals

Avoid turning every turn into a long-lived memory write.
