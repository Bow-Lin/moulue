# API

## `POST /chat`

Creates or continues a chat session with one character.

### Request Body

```json
{
  "agentId": "zhuge_liang",
  "userId": "demo_user",
  "message": "How should I steady my heart?",
  "sessionId": "optional-existing-session-id",
  "debug": true
}
```

Current fields:

- `agentId`: required string
- `userId`: required string
- `message`: required string
- `sessionId`: optional string
- `debug`: optional boolean or object

Current behavior:

- without `sessionId`, the server creates a new session
- with `sessionId`, the server validates that it belongs to the same `userId` and `agentId`

### Success Response

```json
{
  "sessionId": "session-id",
  "agentId": "zhuge_liang",
  "reply": "First establish order within your own heart."
}
```

Returned fields:

- `sessionId`
- `agentId`
- `reply`
- optional `debug`

## Debug Options

`debug` can be:

- `true` for lightweight debug output
- an object with explicit options

Current debug options:

```json
{
  "debug": {
    "includeMemoryContent": true,
    "includePrompt": true,
    "includeRawExtraction": true
  }
}
```

Current meanings:

- `includeMemoryContent`: include full stored memory content in `beforeReply.memoriesUsed`
- `includePrompt`: include the assembled system prompt
- `includeRawExtraction`: include raw extractor output text

### Debug Response Shape

Current debug response is structured as:

```ts
interface ChatDebugTrace {
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
        action: "insert" | "update" | "skip_duplicate" | "discard_low_confidence";
        memoryId?: string;
        reason: string;
      }>;
      rawText?: string;
      parseError?: string;
    };
  };
}
```

### Lightweight Debug Example

```json
{
  "sessionId": "session-id",
  "agentId": "zhuge_liang",
  "reply": "Order begins with a settled purpose.",
  "debug": {
    "beforeReply": {
      "agentId": "zhuge_liang",
      "provider": "fake",
      "prompt": {
        "longTermMemoryCount": 1,
        "hasSessionSummary": false,
        "recentMessageCount": 2
      },
      "memoriesUsed": [
        {
          "id": "mem_1",
          "type": "project_goal",
          "importance": 5,
          "preview": "The user wants the project to become a compelling open-source demo."
        }
      ]
    },
    "afterReply": {
      "extraction": {
        "ran": true,
        "candidates": [],
        "applied": []
      }
    }
  }
}
```

## `POST /memory/add`

Manually inserts one long-term memory item.

### Request Body

```json
{
  "userId": "demo_user",
  "agentId": "zhuge_liang",
  "type": "project_goal",
  "content": "The user wants the project to become a compelling open-source demo.",
  "importance": 5
}
```

Required fields:

- `userId`
- `agentId`
- `type`
- `content`
- `importance`

Supported memory types:

- `user_preference`
- `project`
- `project_goal`
- `fact`
- `style`
- `constraint`
- `relationship`

### Success Response

```json
{
  "id": "memory-id"
}
```

## Error Responses

Current route-level errors:

- `400` for invalid JSON, missing fields, invalid debug options, invalid memory type, or mismatched session
- `404` for unknown `agentId`
- `500` for unexpected internal failures

Typical error response:

```json
{
  "error": "Missing required fields"
}
```

## Example Requests

### Start a New Session

```bash
curl -X POST http://localhost:3000/chat \
  -H 'content-type: application/json' \
  -d '{
    "agentId": "zhuge_liang",
    "userId": "demo_user",
    "message": "How should I begin?"
  }'
```

### Continue a Session

```bash
curl -X POST http://localhost:3000/chat \
  -H 'content-type: application/json' \
  -d '{
    "agentId": "zhuge_liang",
    "userId": "demo_user",
    "sessionId": "returned-session-id",
    "message": "What should I do next?"
  }'
```

### Add Manual Memory

```bash
curl -X POST http://localhost:3000/memory/add \
  -H 'content-type: application/json' \
  -d '{
    "userId": "demo_user",
    "agentId": "zhuge_liang",
    "type": "project_goal",
    "content": "The user wants the project to become a compelling open-source demo.",
    "importance": 5
  }'
```
