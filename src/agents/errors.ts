export class UnknownAgentError extends Error {
  constructor(agentId: string) {
    super(`Unknown agent: ${agentId}`);
    this.name = "UnknownAgentError";
  }
}

export class InvalidAgentIdError extends Error {
  constructor(agentId: string) {
    super(`Invalid agent id: ${agentId}`);
    this.name = "InvalidAgentIdError";
  }
}

export class InvalidSessionError extends Error {
  constructor(sessionId: string) {
    super(`Invalid session: ${sessionId}`);
    this.name = "InvalidSessionError";
  }
}
