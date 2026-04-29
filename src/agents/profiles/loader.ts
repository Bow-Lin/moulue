import { toAgentProfile } from "../profile";
import type { AgentProfile } from "../../types/agent";

const AGENT_ID_PATTERN = /^[a-z0-9_-]+$/;

export const loadProfile = async (agentId: string): Promise<AgentProfile> => {
  if (!AGENT_ID_PATTERN.test(agentId)) {
    throw new Error(`Invalid agent profile id: ${agentId}`);
  }

  const profileFileUrl = new URL(`./${agentId}.yaml`, import.meta.url);
  const profileFile = Bun.file(profileFileUrl);

  if (!(await profileFile.exists())) {
    throw new Error(`Unknown agent profile: ${agentId}`);
  }

  const rawProfile = Bun.YAML.parse(await profileFile.text()) as Record<string, unknown>;
  return toAgentProfile(rawProfile, agentId);
};
