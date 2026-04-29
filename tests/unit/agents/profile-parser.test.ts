import { describe, expect, test } from "bun:test";
import { toAgentProfile } from "../../../src/agents/profile";

describe("toAgentProfile", () => {
  test("rejects profiles whose agent_id does not match the requested agent id", () => {
    expect(() =>
      toAgentProfile(
        {
          schema_version: 1,
          agent_id: "cao_cao",
          type: "historical_character",
          name: "Cao Cao",
          faction: "Wei",
          identity: {
            title: "Warlord",
            role: "Ruler",
            era_context: "Late Han",
          },
          background: {
            summary: "A strategic ruler.",
            formative_experiences: ["War and statecraft."],
          },
          core_values: ["order"],
          goals: {
            long_term: ["Unify the realm."],
            short_term: ["Secure the frontier."],
          },
          personality: {
            traits: ["decisive"],
            strengths: ["organization"],
            flaws: ["suspicion"],
          },
          decision_policy: {
            default_strategy: "Judge risk first.",
            prefers: ["control"],
            avoids: ["chaos"],
            when_weak: ["stabilize"],
            when_strong: ["consolidate"],
          },
          relationships: {
            liu_bei: "A rival worth watching.",
          },
          speaking_style: {
            tone: ["direct"],
            rhetorical_patterns: ["judge first"],
          },
          speech_constraints: ["Do not sound generic."],
          response_policy: {
            default_length: "medium",
            answer_structure: ["judge", "explain", "advise"],
          },
        },
        "zhuge_liang",
      ),
    ).toThrow("Profile agent_id does not match requested agentId");
  });
});
