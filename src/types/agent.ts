export type AgentProfile = {
  schemaVersion: number;
  agentId: string;
  type: string;
  name: string;
  faction: string;
  identity: {
    title: string;
    role: string;
    eraContext: string;
  };
  background: {
    summary: string;
    formativeExperiences: string[];
  };
  coreValues: string[];
  goals: {
    longTerm: string[];
    shortTerm: string[];
  };
  personality: {
    traits: string[];
    strengths: string[];
    flaws: string[];
  };
  decisionPolicy: {
    defaultStrategy: string;
    prefers: string[];
    avoids: string[];
    whenWeak: string[];
    whenStrong: string[];
  };
  relationships: Record<string, string>;
  speakingStyle: {
    tone: string[];
    rhetoricalPatterns: string[];
  };
  speechConstraints: string[];
  responsePolicy: {
    defaultLength: string;
    answerStructure: string[];
  };
};
