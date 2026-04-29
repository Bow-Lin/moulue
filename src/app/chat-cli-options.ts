const DEFAULT_AGENT_ID = "zhuge_liang";

export type ChatCliOptions = {
  agentId: string;
  debugEnabled: boolean;
  debugFull: boolean;
};

export const parseChatCliOptions = (args: string[]): ChatCliOptions => {
  let agentId = DEFAULT_AGENT_ID;
  let debugEnabled = false;
  let debugFull = false;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--debug") {
      debugEnabled = true;
      continue;
    }

    if (arg === "--debug-full") {
      debugEnabled = true;
      debugFull = true;
      continue;
    }

    if (arg === "--agent" || arg === "-a") {
      const nextValue = args[index + 1];

      if (!nextValue) {
        throw new Error(`Missing value for ${arg}`);
      }

      agentId = nextValue;
      index += 1;
    }
  }

  return {
    agentId,
    debugEnabled,
    debugFull,
  };
};
