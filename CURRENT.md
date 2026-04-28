# CURRENT.md

`CURRENT.md` should stay short, execution-oriented, and easy to refresh.

## Current Focus

Establish a clean repository foundation for a **single-character Three Kingdoms chat experience** centered on Zhuge Liang.

## Active Priorities

- keep `AGENTS.md` stable and low-churn
- move detailed guidance into `docs/`
- preserve a chat-first, character-first architecture
- keep implementation lightweight and local

## Next Steps

- implement the first usable chat runtime
- define a character profile format for Zhuge Liang
- add short-term conversation memory
- add persistent user impression memory
- add simple session and message persistence

## Open Questions

- how much rolling summary is needed before prompt size becomes an issue
- what minimal impression schema feels useful without becoming noisy
- what prompt constraints best suppress generic assistant phrasing

## Recent Decisions

- `AGENTS.md` contains long-lived repository rules only
- mutable project state lives in `CURRENT.md`
- implementation details are disclosed gradually through first-level docs
- Zhuge Liang is the reference character for early product and prompt choices
