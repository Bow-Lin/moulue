# Architecture

## Goal

Build a small, explicit runtime for **single-character roleplay chat**.

The architecture should optimize for clarity, easy iteration, and clean separation between character identity, short-term context, and persistent user impressions.

## Core Components

### `AgentProfile`

Defines stable character identity. This should include fields such as:

- `agent_id`
- `name`
- `faction`
- `background_summary`
- `core_values`
- `style_rules`
- `speech_constraints`

This data is configuration, not runtime memory.

### `BaseChatAgent`

Owns reply generation for one character. It should:

- load the character profile
- assemble prompt context
- request relevant memory
- produce a reply in character

### `MemoryManager`

Coordinates memory reads and writes across:

- recent conversation context
- long-lived user impressions

It should not own immutable character identity.

### `ConversationStore`

Persists sessions and message history. It should provide clear access by:

- `user_id`
- `agent_id`
- `session_id`

### `AgentFactory`

Creates configured chat agents without introducing unnecessary subclass complexity.

## Data Flow

The intended flow is:

1. load the selected `AgentProfile`
2. load recent conversation context for the session
3. load long-lived impression memory for the user-character pair
4. assemble the prompt in a fixed, readable order
5. generate the in-character reply
6. persist the new message pair
7. optionally update impression memory when the interaction merits it

## Separation Rules

Keep these concerns distinct:

- character profile
- short-term memory
- impression memory
- persistence layer
- LLM client

Avoid a single omniscient object that hides all of this behind vague helpers.

## Storage Defaults

Use simple local storage first:

- SQLite for sessions, messages, and memory records
- JSON or YAML for profiles and prompt configuration

Avoid heavier infrastructure until concrete product pressure exists.
