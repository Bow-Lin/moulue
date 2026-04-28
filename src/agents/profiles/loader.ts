import { toAgentProfile } from "../profile";
import type { AgentProfile } from "../../types/agent";

const profileFiles: Record<string, URL> = {
  zhuge_liang: new URL("./zhuge_liang.yaml", import.meta.url),
};

export const loadProfile = async (agentId: string): Promise<AgentProfile> => {
  const profileFileUrl = profileFiles[agentId];

  if (!profileFileUrl) {
    throw new Error(`Unknown agent profile: ${agentId}`);
  }

  const rawProfile = Bun.YAML.parse(await Bun.file(profileFileUrl).text()) as Record<string, unknown>;
  return toAgentProfile(rawProfile);
};
