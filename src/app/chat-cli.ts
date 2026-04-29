import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { parseChatCliOptions } from "./chat-cli-options";
import { readDevServerRuntime } from "./runtime-file";

const DEFAULT_USER_ID = "demo_user";
const EXIT_COMMANDS = new Set(["exit", "quit"]);

type ChatResponse = {
  sessionId: string;
  agentId: string;
  reply: string;
  debug?: {
    beforeReply: {
      agentId: string;
      provider: string;
      prompt: {
        longTermMemoryCount: number;
        hasSessionSummary: boolean;
        recentMessageCount: number;
      };
      memoriesUsed: Array<{
        id: string;
        type: string;
        importance: number;
        preview: string;
        content?: string;
      }>;
      assembledPrompt?: string;
    };
    afterReply: {
      extraction: {
        ran: boolean;
        candidates: Array<{
          type: string;
          content: string;
          confidence: number;
          importance: number;
          reason?: string;
        }>;
        applied: Array<{
          candidateIndex: number;
          action: string;
          memoryId?: string;
          reason: string;
        }>;
        rawText?: string;
        parseError?: string;
      };
    };
  };
};

const cliOptions = parseChatCliOptions(Bun.argv.slice(2));

const formatAgentLabel = (agentId: string): string => {
  return agentId
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

const readServerBaseUrl = (): string | null => {
  const runtime = readDevServerRuntime();

  if (!runtime) {
    return null;
  }

  return `http://localhost:${runtime.port}`;
};

const printErrorResponse = async (response: Response): Promise<void> => {
  const body = await response.text();
  console.error(`Request failed with status ${response.status}`);
  console.error(body);
};

const main = async (): Promise<void> => {
  const serverBaseUrl = readServerBaseUrl();

  if (!serverBaseUrl) {
    console.error("No dev server runtime metadata found. Start the server with `bun run dev` first.");
    process.exitCode = 1;
    return;
  }

  const cli = createInterface({
    input: stdin,
    output: stdout,
  });

  let sessionId: string | undefined;

  console.log(`Talking to ${formatAgentLabel(cliOptions.agentId)}. Type \`quit\` or \`exit\` to leave.`);

  try {
    while (true) {
      let rawInput: string;

      try {
        rawInput = await cli.question("You: ");
      } catch (error) {
        if (error instanceof Error && error.message.includes("readline was closed")) {
          break;
        }

        throw error;
      }

      const input = rawInput.trim();

      if (input === "") {
        continue;
      }

      if (EXIT_COMMANDS.has(input.toLowerCase())) {
        break;
      }

      let response: Response;

      try {
        response = await fetch(`${serverBaseUrl}/chat`, {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            agentId: cliOptions.agentId,
            userId: DEFAULT_USER_ID,
            message: input,
            sessionId,
            ...(cliOptions.debugEnabled
              ? {
                  debug: cliOptions.debugFull
                    ? {
                        includeMemoryContent: true,
                        includePrompt: true,
                        includeRawExtraction: true,
                      }
                    : true,
                }
              : {}),
          }),
        });
      } catch (error) {
        console.error(`Could not reach ${serverBaseUrl}/chat. Is the dev server running?`);
        if (error instanceof Error) {
          console.error(error.message);
        }
        continue;
      }

      if (!response.ok) {
        await printErrorResponse(response);
        continue;
      }

      const body = (await response.json()) as ChatResponse;
      sessionId = body.sessionId;

      console.log(`\n${formatAgentLabel(body.agentId)}:`);
      console.log(body.reply);
      if (body.debug) {
        console.log("[Debug]");
        console.log(`provider: ${body.debug.beforeReply.provider}`);
        console.log(`long-term memories: ${body.debug.beforeReply.prompt.longTermMemoryCount}`);
        console.log(`session summary: ${body.debug.beforeReply.prompt.hasSessionSummary ? "yes" : "no"}`);
        console.log(`recent messages: ${body.debug.beforeReply.prompt.recentMessageCount}`);

        if (body.debug.beforeReply.memoriesUsed.length > 0) {
          console.log("memories used:");
          for (const memory of body.debug.beforeReply.memoriesUsed) {
            console.log(`- ${memory.type} (${memory.importance}): ${memory.preview}`);
          }
        }

        console.log(`extractor ran: ${body.debug.afterReply.extraction.ran ? "yes" : "no"}`);
        if (body.debug.afterReply.extraction.candidates.length > 0) {
          console.log("memory candidates:");
          for (const candidate of body.debug.afterReply.extraction.candidates) {
            console.log(`- ${candidate.type} (${candidate.confidence}): ${candidate.content}`);
          }
        }
        if (body.debug.afterReply.extraction.applied.length > 0) {
          console.log("memory decisions:");
          for (const decision of body.debug.afterReply.extraction.applied) {
            console.log(`- [${decision.action}] candidate ${decision.candidateIndex}: ${decision.reason}`);
          }
        }
        if (body.debug.afterReply.extraction.parseError) {
          console.log(`extractor parse error: ${body.debug.afterReply.extraction.parseError}`);
        }
        if (body.debug.afterReply.extraction.rawText) {
          console.log("[Extractor Raw]");
          console.log(body.debug.afterReply.extraction.rawText);
        }
        if (body.debug.beforeReply.assembledPrompt) {
          console.log("[Prompt]");
          console.log(body.debug.beforeReply.assembledPrompt);
        }
      }
      console.log("");
    }
  } finally {
    cli.close();
  }
};

await main();
