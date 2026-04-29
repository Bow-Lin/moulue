import type { AgentProfile } from "../types/agent";

type RawAgentProfile = {
  schema_version?: unknown;
  agent_id?: unknown;
  type?: unknown;
  name?: unknown;
  faction?: unknown;
  identity?: unknown;
  background?: unknown;
  core_values?: unknown;
  goals?: unknown;
  personality?: unknown;
  decision_policy?: unknown;
  relationships?: unknown;
  speaking_style?: unknown;
  speech_constraints?: unknown;
  response_policy?: unknown;
};

const readObject = (value: unknown, fieldName: string): Record<string, unknown> => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(`Invalid agent profile field: ${fieldName}`);
  }

  return value as Record<string, unknown>;
};

const readString = (value: unknown, fieldName: string): string => {
  if (typeof value !== "string") {
    throw new Error(`Invalid agent profile field: ${fieldName}`);
  }

  return value;
};

const readStringList = (value: unknown, fieldName: string): string[] => {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    throw new Error(`Invalid agent profile field: ${fieldName}`);
  }

  return value;
};

const readStringRecord = (value: unknown, fieldName: string): Record<string, string> => {
  const record = readObject(value, fieldName);

  for (const [key, entry] of Object.entries(record)) {
    if (typeof entry !== "string") {
      throw new Error(`Invalid agent profile field: ${fieldName}.${key}`);
    }
  }

  return record as Record<string, string>;
};

export const toAgentProfile = (rawProfile: RawAgentProfile, requestedAgentId: string): AgentProfile => {
  if (rawProfile.schema_version !== 1) {
    throw new Error("Invalid agent profile field: schema_version");
  }

  const agentId = readString(rawProfile.agent_id, "agent_id");

  if (agentId !== requestedAgentId) {
    throw new Error("Profile agent_id does not match requested agentId");
  }

  const identity = readObject(rawProfile.identity, "identity");
  const background = readObject(rawProfile.background, "background");
  const goals = readObject(rawProfile.goals, "goals");
  const personality = readObject(rawProfile.personality, "personality");
  const decisionPolicy = readObject(rawProfile.decision_policy, "decision_policy");
  const speakingStyle = readObject(rawProfile.speaking_style, "speaking_style");
  const responsePolicy = readObject(rawProfile.response_policy, "response_policy");

  return {
    schemaVersion: 1,
    agentId,
    type: readString(rawProfile.type, "type"),
    name: readString(rawProfile.name, "name"),
    faction: readString(rawProfile.faction, "faction"),
    identity: {
      title: readString(identity.title, "identity.title"),
      role: readString(identity.role, "identity.role"),
      eraContext: readString(identity.era_context, "identity.era_context"),
    },
    background: {
      summary: readString(background.summary, "background.summary"),
      formativeExperiences: readStringList(
        background.formative_experiences,
        "background.formative_experiences",
      ),
    },
    coreValues: readStringList(rawProfile.core_values, "core_values"),
    goals: {
      longTerm: readStringList(goals.long_term, "goals.long_term"),
      shortTerm: readStringList(goals.short_term, "goals.short_term"),
    },
    personality: {
      traits: readStringList(personality.traits, "personality.traits"),
      strengths: readStringList(personality.strengths, "personality.strengths"),
      flaws: readStringList(personality.flaws, "personality.flaws"),
    },
    decisionPolicy: {
      defaultStrategy: readString(decisionPolicy.default_strategy, "decision_policy.default_strategy"),
      prefers: readStringList(decisionPolicy.prefers, "decision_policy.prefers"),
      avoids: readStringList(decisionPolicy.avoids, "decision_policy.avoids"),
      whenWeak: readStringList(decisionPolicy.when_weak, "decision_policy.when_weak"),
      whenStrong: readStringList(decisionPolicy.when_strong, "decision_policy.when_strong"),
    },
    relationships: readStringRecord(rawProfile.relationships, "relationships"),
    speakingStyle: {
      tone: readStringList(speakingStyle.tone, "speaking_style.tone"),
      rhetoricalPatterns: readStringList(
        speakingStyle.rhetorical_patterns,
        "speaking_style.rhetorical_patterns",
      ),
    },
    speechConstraints: readStringList(rawProfile.speech_constraints, "speech_constraints"),
    responsePolicy: {
      defaultLength: readString(responsePolicy.default_length, "response_policy.default_length"),
      answerStructure: readStringList(responsePolicy.answer_structure, "response_policy.answer_structure"),
    },
  };
};
