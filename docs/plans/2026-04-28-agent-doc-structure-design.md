# Repository Guidance Refactor Design

## Goal

Split stable repository rules from mutable project state and move detailed implementation guidance into first-level topic docs under `docs/`.

## Design

### Stable Layer

`AGENTS.md` becomes the stable operating contract for the repository. It should define long-lived product direction, non-goals, architecture bias, and AI agent behavior. It should avoid short-lived work tracking.

### Mutable Layer

`CURRENT.md` becomes the single source of truth for changing project status. It should hold active focus, next steps, open questions, and recent decisions.

### Progressive Disclosure

Detailed guidance moves into topic docs so agents only read what the current task needs. The first-level topics are product, architecture, memory, prompting, testing, and the reference character definition for Zhuge Liang.

## Expected Outcome

- `AGENTS.md` changes rarely
- mutable status has one clear home
- detailed guidance is available without bloating the top-level contract
