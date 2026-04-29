import { buildAgent } from "../../agents/factory";
import { InvalidAgentIdError, InvalidSessionError, UnknownAgentError } from "../../agents/errors";
import { SQLiteStore } from "../../storage/sqlite-store";

type ChatRouteDependencies = {
  store: SQLiteStore;
};

type ChatRequestBody = {
  agentId?: unknown;
  userId?: unknown;
  message?: unknown;
  sessionId?: unknown;
  debug?: unknown;
};

type DebugRequestOptions = {
  enabled: boolean;
  includeMemoryContent?: boolean;
  includePrompt?: boolean;
  includeRawExtraction?: boolean;
};

const jsonResponse = (body: unknown, status: number): Response => {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
    },
  });
};

const parseRequestBody = async (request: Request): Promise<{
  agentId: string;
  userId: string;
  message: string;
  sessionId?: string;
  debug?: DebugRequestOptions;
}> => {
  let body: ChatRequestBody;

  try {
    body = (await request.json()) as ChatRequestBody;
  } catch {
    throw new TypeError("Invalid JSON body");
  }

  if (typeof body.agentId !== "string" || typeof body.userId !== "string" || typeof body.message !== "string") {
    throw new TypeError("Missing required fields");
  }

  if (body.sessionId !== undefined && typeof body.sessionId !== "string") {
    throw new TypeError("Invalid sessionId");
  }

  let debug: DebugRequestOptions | undefined;

  if (body.debug !== undefined) {
    if (body.debug === true) {
      debug = { enabled: true };
    } else if (
      typeof body.debug === "object" &&
      body.debug !== null &&
      !Array.isArray(body.debug)
    ) {
      const debugBody = body.debug as {
        includeMemoryContent?: unknown;
        includePrompt?: unknown;
        includeRawExtraction?: unknown;
      };

      if (
        (debugBody.includeMemoryContent !== undefined &&
          typeof debugBody.includeMemoryContent !== "boolean") ||
        (debugBody.includePrompt !== undefined && typeof debugBody.includePrompt !== "boolean") ||
        (debugBody.includeRawExtraction !== undefined &&
          typeof debugBody.includeRawExtraction !== "boolean")
      ) {
        throw new TypeError("Invalid debug options");
      }

      debug = {
        enabled: true,
        includeMemoryContent: debugBody.includeMemoryContent,
        includePrompt: debugBody.includePrompt,
        includeRawExtraction: debugBody.includeRawExtraction,
      };
    } else {
      throw new TypeError("Invalid debug options");
    }
  }

  return {
    agentId: body.agentId,
    userId: body.userId,
    message: body.message,
    sessionId: body.sessionId,
    debug,
  };
};

export const handleChatRequest = async (
  request: Request,
  dependencies: ChatRouteDependencies,
): Promise<Response> => {
  try {
    const body = await parseRequestBody(request);
    const agent = await buildAgent({
      agentId: body.agentId,
      store: dependencies.store,
    });

    const result = await agent.reply({
      userId: body.userId,
      message: body.message,
      sessionId: body.sessionId,
      debug: body.debug,
    });

    return jsonResponse(result, 200);
  } catch (error) {
    if (error instanceof TypeError || error instanceof InvalidSessionError || error instanceof InvalidAgentIdError) {
      return jsonResponse({ error: error.message }, 400);
    }

    if (error instanceof UnknownAgentError) {
      return jsonResponse({ error: error.message }, 404);
    }

    return jsonResponse({ error: "Internal server error" }, 500);
  }
};
