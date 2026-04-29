# CURRENT.md

`CURRENT.md` should stay short, execution-oriented, and easy to refresh.

## Current Focus

Close out **v0.2 Profile-driven Multi-character Chat** as a stable milestone, then start **v0.3 Minimal Local Web UI** without expanding scope.

## Active Priorities

- keep the current profile-driven runtime stable and well-bounded
- document `v0.2` as complete so new work does not keep expanding it
- start `v0.3` with a minimal local web surface over the existing HTTP API
- preserve the chat-first, memory-aware runtime as the single source of truth

## Next Steps

- add `docs/releases/v0.2.md` as the phase boundary for the current runtime
- add minimal profile read APIs for the upcoming web UI:
  - `GET /profiles`
  - `GET /profiles/:agentId`
- serve a minimal local web page from the existing Bun server
- expose three basic UI surfaces:
  - character summary
  - chat session
  - debug trace
- keep `v0.3` out of profile editing, memory management UI, and broader simulation features

## Open Questions

- whether `v0.3` should stay plain static HTML/JS or introduce a frontend toolchain later
- what the smallest safe profile summary shape should be for public read APIs
- how much debug detail should be visible by default without exposing full prompt internals

## Recent Decisions

- `AGENTS.md` contains long-lived repository rules only
- mutable project state lives in `CURRENT.md`
- implementation details are disclosed gradually through first-level docs
- `v0.2` is named **Profile-driven Multi-character Chat**
- `v0.2` is defined by profile-driven character loading, CLI/HTTP agent selection, and memory isolation by `user_id + agent_id`
- `v0.3` starts as a **Minimal Local Web UI** for profile summary, chat, memory visibility, and debug trace
- Zhuge Liang remains the quality calibration reference even though multiple built-in characters now exist

## Smoke Test

- start the local server with `bun run dev`
- call `POST /chat` with `agentId: "zhuge_liang"` and without `sessionId`
- reuse the returned `sessionId` in a second `POST /chat` with the same `userId` and `agentId`
- repeat with `agentId: "cao_cao"` to confirm profile selection works
- confirm replies are non-empty and that session continuity stays isolated by `user_id + agent_id`
