# Product

## Intent

The product should feel like a **character chat experience**, not a generic assistant wrapped in historical flavor text.

The user should feel that they are speaking with a distinct Three Kingdoms figure who:

- has a stable point of view
- speaks with a recognizable tone
- remembers the recent conversation
- carries lightweight continuity across sessions

## MVP

The MVP loop is intentionally narrow:

1. the user opens a chat
2. the user talks to one character
3. the character replies in role
4. recent dialogue context is preserved
5. lightweight user-specific impressions can persist

Anything beyond this loop is secondary until the loop feels good.

## Product Priorities

Order decisions by:

1. character believability
2. dialogue quality
3. continuity across turns
4. continuity across sessions
5. simple extensibility for future characters

## Success Criteria

A change is valuable when it improves one or more of:

- believable in-character dialogue
- stable character voice
- memory continuity
- clean and comprehensible implementation
- future addition of new characters without rewrites

A change is not valuable merely because it is:

- more abstract
- more generic
- more agentic
- more infrastructure-heavy

## Scope Guardrails

Do not expand into:

- workflow platforms
- world simulation
- task systems
- general multi-agent coordination
- retrieval-heavy infrastructure

The current job is to make one conversation feel convincing.
