import { handleChatRequest } from "./routes/chat";
import { handleAddMemoryRequest } from "./routes/memory";
import { writeDevServerRuntime } from "./runtime-file";
import { SQLiteStore } from "../storage/sqlite-store";

type CreateServerOptions = {
  dbPath: string;
};

type FetchCapableServer = {
  fetch(request: Request): Response | Promise<Response>;
};

export const createServer = (_options: CreateServerOptions): FetchCapableServer => {
  const store = new SQLiteStore(_options.dbPath);

  return {
    fetch(request: Request) {
      const url = new URL(request.url);

      if (request.method === "POST" && url.pathname === "/chat") {
        return handleChatRequest(request, { store });
      }

      if (request.method === "POST" && url.pathname === "/memory/add") {
        return handleAddMemoryRequest(request, { store });
      }

      return new Response("Not found", { status: 404 });
    },
  };
};

if (import.meta.main) {
  const server = createServer({
    dbPath: Bun.env.CHAT_DB_PATH ?? "character-chat.sqlite",
  });
  const port = Number(Bun.env.PORT ?? "0");

  const httpServer = Bun.serve({
    port,
    fetch: server.fetch,
  });

  writeDevServerRuntime({ port: httpServer.port });
  console.log(`Character chat server listening on http://localhost:${httpServer.port}`);
}
