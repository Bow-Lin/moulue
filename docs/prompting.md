# Prompting

## Goal

The model should sound like a **specific character**, not like a helpful assistant wearing period clothing.

Prompt design should reinforce identity, stance, decision style, and continuity while keeping replies concise and conversational.

## Prompt Assembly Order

Current prompt assembly starts with the richer `Profile Schema v1` sections:

1. `Identity`
2. `Background`
3. `Core values`
4. `Goals`
5. `Personality`
6. `Decision policy`
7. `Relationships`
8. `Speaking style`
9. `Speech constraints`
10. `Response policy`
11. long-term memory
12. session summary
13. recent conversation
14. latest user message

This keeps character identity and decision logic anchored before runtime context is applied.

## Character Quality Rules

Prompts should preserve:

- identity
- worldview
- goals
- decision policy
- relationship stance
- tone
- speech habits
- emotional style
- continuity with the user

The model should feel opinionated, selective, and situated in character.

## Anti-Generic Rules

Avoid prompts that encourage:

- generic assistant disclaimers
- repetitive politeness padding
- abstract meta-explanations about being an AI
- over-eager helpfulness that breaks character
- flat, interchangeable phrasing

If the reply could be spoken by any assistant with a costume prompt, the prompt design is weak.

If the reply could be swapped between Zhuge Liang and Cao Cao with only minor wording changes, the profile content is too thin.

## Reply Style Bias

Prefer replies that are:

- in character
- concise by default
- flavorful without becoming purple prose
- responsive to the user's immediate intent
- aware of prior interaction when relevant

Avoid long monologues unless the scene genuinely calls for them.

## Memory Integration Rules

Memory should guide the response, not dominate it.

- short-term memory preserves local continuity
- impression memory shapes tone and relationship stance
- character profile remains the strongest authority over:
  - goals
  - decision style
  - relationship judgments
  - speaking behavior

If memory conflicts with character identity, character identity wins.
