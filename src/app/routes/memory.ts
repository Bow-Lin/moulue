import type { CreateMemoryItemInput, MemoryType } from "../../types/memory";
import { SQLiteStore } from "../../storage/sqlite-store";

type MemoryRouteDependencies = {
  store: SQLiteStore;
};

type MemoryRequestBody = {
  userId?: unknown;
  agentId?: unknown;
  type?: unknown;
  content?: unknown;
  importance?: unknown;
};

const MEMORY_TYPES: MemoryType[] = [
  "user_preference",
  "project",
  "project_goal",
  "fact",
  "style",
  "constraint",
  "relationship",
];

const jsonResponse = (body: unknown, status: number): Response => {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
    },
  });
};

const isMemoryType = (value: unknown): value is MemoryType => {
  return typeof value === "string" && MEMORY_TYPES.includes(value as MemoryType);
};

const parseMemoryBody = async (request: Request): Promise<CreateMemoryItemInput> => {
  let body: MemoryRequestBody;

  try {
    body = (await request.json()) as MemoryRequestBody;
  } catch {
    throw new TypeError("Invalid JSON body");
  }

  if (
    typeof body.userId !== "string" ||
    typeof body.agentId !== "string" ||
    typeof body.content !== "string" ||
    typeof body.importance !== "number"
  ) {
    throw new TypeError("Missing required fields");
  }

  if (!isMemoryType(body.type)) {
    throw new TypeError("Invalid memory type");
  }

  return {
    userId: body.userId,
    agentId: body.agentId,
    type: body.type,
    content: body.content,
    importance: body.importance,
  };
};

export const handleAddMemoryRequest = async (
  request: Request,
  dependencies: MemoryRouteDependencies,
): Promise<Response> => {
  try {
    const input = await parseMemoryBody(request);
    const memoryId = dependencies.store.addMemoryItem(input);
    return jsonResponse({ id: memoryId }, 200);
  } catch (error) {
    if (error instanceof TypeError) {
      return jsonResponse({ error: error.message }, 400);
    }

    return jsonResponse({ error: "Internal server error" }, 500);
  }
};
