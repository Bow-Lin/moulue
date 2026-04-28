# AGENTS.md

## Purpose

This repository builds a **Three Kingdoms character chat system**.

Its purpose is to deliver a **believable single-character chat experience** with:

- stable personality
- consistent tone
- conversational continuity
- lightweight user-specific memory

This repository is not for building a general agent platform, workflow engine, or orchestration framework.

---

## Stability Rule

`AGENTS.md` is the repository's stable operating contract.

It should contain **long-lived guidance** only and should **not** be updated frequently for short-term work.

Do not use this file to track:

- current stage
- active tasks
- temporary priorities
- short-lived implementation plans

Put mutable project status in `CURRENT.md`.

---

## Product Direction

Default to a product that feels like:

- a character chat experience, not a generic assistant
- one believable historical character at a time
- continuity across turns and across sessions
- configuration-driven character identity

Prioritize:

1. character believability
2. dialogue quality
3. continuity and memory
4. simple extensibility

Do not prioritize abstraction, infrastructure complexity, or speculative future systems over chat quality.

---

## Explicit Non-Goals

Do not proactively build:

- task assignment systems
- quest systems
- world simulation
- multi-agent orchestration
- autonomous inter-agent communication
- tool-use workflow platforms
- complex planning frameworks
- vector databases
- RAG pipelines
- distributed systems
- plugin ecosystems
- generic agent platforms

If a feature does not clearly improve the chat experience, do not build it yet.

---

## Core Principles

### 1. Chat First

Every technical choice should improve at least one of:

- reply quality
- character consistency
- conversational continuity
- implementation clarity

### 2. One Character First

Build one convincing character before optimizing for many.

### 3. Runtime Over Framework

Prefer a small, practical chat runtime over a general-purpose framework.

### 4. Simple Persistence First

Use lightweight persistence for sessions, messages, and memory before introducing heavier systems.

### 5. Configuration-Driven Identity

Character differences should come primarily from structured configuration such as:

- persona
- tone
- style
- worldview
- constraints
- memory behavior

Avoid deep inheritance and speculative subclass hierarchies.

---

## Architecture Bias

Prefer a structure centered on a few explicit concepts:

- `AgentProfile`
- `BaseChatAgent`
- `MemoryManager`
- `ConversationStore`
- `AgentFactory`

Keep the following concerns separate:

- short-term conversation memory
- long-lived user impression memory
- immutable character profile

Do not introduce abstractions for future multi-character needs until at least one concrete second character requires them.

Do not merge identity, history, and user impression data into one opaque blob.

---

## Storage Bias

Use the simplest storage that works.

Preferred defaults:

- SQLite for sessions, messages, and memory records
- JSON or YAML for character profiles and prompt configuration

Use shared storage with logical isolation through identifiers such as:

- `user_id`
- `agent_id`
- `session_id`

Do not create a separate database per character unless a concrete problem requires it.

---

## Prompting Bias

The model must not sound like a generic assistant in costume.

Prompting should preserve:

- identity
- stance
- tone
- speech habits
- emotional style
- conversational continuity

Optimize for replies that are concise, flavorful, and recognizably in character.

---

## Documentation Model

Use **progressive disclosure**.

`AGENTS.md` should stay brief and stable. Put deeper guidance in topic documents under `docs/`.

Read these files as needed:

- `CURRENT.md` for the current mutable project state
- `docs/product.md` for product goals and MVP boundaries
- `docs/architecture.md` for runtime structure and module boundaries
- `docs/memory.md` for short-term and long-lived memory rules
- `docs/prompting.md` for prompt assembly and roleplay quality rules
- `docs/testing.md` for testing priorities and acceptance strategy
- `docs/characters/zhuge-liang.md` for the reference character definition

---

## What AI Coding Agents Should Do

When working in this repository:

1. read `AGENTS.md` first
2. read `CURRENT.md` for active state
3. read only the relevant topic docs for the task
4. inspect existing files before proposing changes
5. choose the smallest valid implementation
6. preserve the chat-first architecture direction
7. add or run tests when practical
8. summarize changes clearly

Do not:

- refactor broadly without a clear need
- introduce framework-heavy solutions
- implement speculative future systems
- silently change storage assumptions or schema
- add features that mainly expand scope instead of improving chat quality

Before implementing a feature, ask:

1. Does this directly improve chat quality?
2. Does this improve character consistency?
3. Does this improve conversational continuity?
4. Can this be implemented simply?
5. Is this needed now rather than merely plausible later?

If the answer is mostly no, do not implement it yet.

---

## Reference Character

Use **Zhuge Liang** as the reference character for the current stage of product calibration.

Check major decisions against this standard:

- does this help Zhuge Liang feel more believable in conversation?
- does it preserve his identity across sessions?
- does it reduce generic assistant behavior?

Use this rule to validate early chat quality, not to permanently bind the general architecture to a single character.

As more characters are added, evolve this section toward shared cross-character quality standards.

If not, the change is probably premature or mis-scoped for the current stage.
