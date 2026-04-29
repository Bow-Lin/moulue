# Repository Guidance Refactor Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Refactor repository guidance into a stable `AGENTS.md`, a mutable `CURRENT.md`, and first-level docs under `docs/`.

**Architecture:** Keep high-level rules in one stable file, move mutable state to one status file, and expose topic guidance through progressive-disclosure docs. Favor minimal files with explicit boundaries over broad framework documents.

**Tech Stack:** Markdown documentation, repository conventions

---

### Task 1: Create planning docs

**Files:**
- Create: `docs/plans/2026-04-28-agent-doc-structure-design.md`
- Create: `docs/plans/2026-04-28-agent-doc-structure.md`

**Step 1: Write the design summary**

Capture the approved split between stable guidance, mutable status, and topic docs.

**Step 2: Write the implementation plan**

Document the file set and the intended responsibilities for each document.

**Step 3: Review the two plan files**

Confirm the design and implementation plan match the approved direction.

### Task 2: Rewrite the stable repository contract

**Files:**
- Modify: `AGENTS.md`

**Step 1: Remove mutable project-state language**

Delete sections that describe the current stage or any short-lived work tracking.

**Step 2: Keep only long-lived guidance**

Retain purpose, non-goals, design principles, architecture bias, and AI agent rules.

**Step 3: Add first-level documentation entry points**

Point readers to `CURRENT.md` and the relevant files under `docs/`.

### Task 3: Create the mutable status file

**Files:**
- Create: `CURRENT.md`

**Step 1: Define the current focus**

Record the present repository direction and short-term priorities.

**Step 2: Add near-term execution context**

Include next steps, open questions, and recent decisions.

### Task 4: Create first-level topic docs

**Files:**
- Create: `docs/README.md`
- Create: `docs/product.md`
- Create: `docs/architecture.md`
- Create: `docs/memory.md`
- Create: `docs/prompting.md`
- Create: `docs/testing.md`
- Create: `docs/characters/zhuge-liang.md`

**Step 1: Write the docs index**

Define which document answers which class of questions.

**Step 2: Write each topic file**

Keep each file narrow, stable, and directly aligned with the approved repository direction.

**Step 3: Check cross-document boundaries**

Ensure the files do not repeat mutable project-state information that belongs in `CURRENT.md`.

### Task 5: Validate consistency

**Files:**
- Review: `AGENTS.md`
- Review: `CURRENT.md`
- Review: `docs/**/*.md`

**Step 1: Read the final structure**

Verify the stable/mutable split is clear.

**Step 2: Check for redundancy and drift**

Make sure no file reintroduces current-stage tracking into `AGENTS.md`.

**Step 3: Summarize the resulting structure**

Prepare a concise handoff describing what changed and where new guidance lives.
