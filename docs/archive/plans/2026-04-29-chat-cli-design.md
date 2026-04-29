# Chat CLI Design

**Date:** 2026-04-29

## Goal

Provide a temporary terminal chat client that talks to the existing local `POST /chat` endpoint without adding a frontend.

## Scope

This design adds only a thin CLI layer for debugging:

- one `bun run chat` command
- one active conversation per CLI process
- automatic reuse of `sessionId`
- automatic discovery of the current dev server port

It does not add:

- frontend UI
- multi-character switching
- streaming responses
- persisted chat transcripts
- service auto-start

## Runtime Model

The CLI remains a thin HTTP client over the existing chat API.

- `bun run dev` remains the source of truth for the server runtime
- `bun run chat` only reads input, calls `/chat`, and prints replies
- the CLI does not call the chat runtime directly

This preserves one primary runtime path: the existing HTTP endpoint.

## Port Discovery

The dev server should choose its port like this:

1. if `PORT` is set, use it
2. otherwise bind to an available local port

After startup, the server writes its active port to a local runtime file:

`/.runtime/dev-server.json`

That file should contain at least:

```json
{
  "port": 43127
}
```

The CLI reads that file to discover where to send requests.

## CLI Flow

When `bun run chat` starts:

1. read `/.runtime/dev-server.json`
2. build the local `/chat` URL from the stored port
3. print a one-line instruction message
4. read terminal input in a loop
5. send each non-empty line to `POST /chat`
6. print the reply
7. retain the returned `sessionId` for the next turn
8. exit on `quit` or `exit`

## Error Handling

The CLI should stay plain and explicit:

- if the runtime file is missing, tell the user to start `bun run dev`
- if the server cannot be reached, print a direct connection error
- if `/chat` returns a non-200 response, print the status code and response body

The CLI should not try to recover by scanning ports or starting background services.

## Acceptance

This feature is acceptable when:

- `bun run dev` writes the active port to `/.runtime/dev-server.json`
- `bun run chat` can discover that port automatically
- a user can send at least two turns in one CLI session
- the second turn reuses the same `sessionId`
