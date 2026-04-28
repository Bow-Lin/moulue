import type { AgentProfile } from "../types/agent";

type RawAgentProfile = {
  agent_id?: unknown;
  name?: unknown;
  faction?: unknown;
  background_summary?: unknown;
  core_values?: unknown;
  style_rules?: unknown;
  speech_constraints?: unknown;
};

const readStringList = (value: unknown, fieldName: string): string[] => {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    throw new Error(`Invalid agent profile field: ${fieldName}`);
  }

  return value;
};

export const toAgentProfile = (rawProfile: RawAgentProfile): AgentProfile => {
  if (typeof rawProfile.agent_id !== "string") {
    throw new Error("Invalid agent profile field: agent_id");
  }

  if (typeof rawProfile.name !== "string") {
    throw new Error("Invalid agent profile field: name");
  }

  if (typeof rawProfile.faction !== "string") {
    throw new Error("Invalid agent profile field: faction");
  }

  if (typeof rawProfile.background_summary !== "string") {
    throw new Error("Invalid agent profile field: background_summary");
  }

  return {
    agentId: rawProfile.agent_id,
    name: rawProfile.name,
    faction: rawProfile.faction,
    backgroundSummary: rawProfile.background_summary,
    coreValues: readStringList(rawProfile.core_values, "core_values"),
    styleRules: readStringList(rawProfile.style_rules, "style_rules"),
    speechConstraints: readStringList(rawProfile.speech_constraints, "speech_constraints"),
  };
};
