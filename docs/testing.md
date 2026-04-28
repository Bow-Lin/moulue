# Testing

## Goal

Testing should protect the stable, deterministic parts of the chat runtime while keeping LLM-dependent checks lightweight.

## Highest-Priority Tests

Write deterministic tests first for:

- character profile loading
- prompt context assembly
- short-term memory windowing behavior
- impression memory read and write logic
- session and message persistence
- configuration validation

## LLM-Dependent Testing

Use lightweight checks for model-facing behavior.

Examples:

- prompt snapshot tests
- smoke tests that verify reply generation paths run
- targeted qualitative review for in-character behavior

Do not rely on brittle exact-string assertions for rich model output.

## Acceptance Focus

Evaluate product quality by asking:

- does the character sound recognizably like the intended figure
- does recent context carry across turns
- do repeated sessions feel continuous
- does memory improve the interaction without becoming noisy

## Testing Bias

Prefer:

- small deterministic unit tests
- explicit fixtures
- isolated persistence tests
- stable tests around non-LLM logic

Avoid:

- over-mocking the entire runtime
- large fragile end-to-end suites too early
- model-output assertions that break on harmless wording shifts
