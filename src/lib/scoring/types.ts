// Types for the AgentScore scoring engine.
// These are distinct from the scaffold's general types — they match the PRD manifest spec.

export interface AgentScoreManifest {
  version: string;
  exportedAt: string;
  generator: string;
  username: string;
  github: string;
  agents: {
    count: number;
    names: string[];
    hasSharedDir: boolean;
  };
  memory: {
    hasMemoryMd: boolean;
    memoryFileCount: number;
    memoryCategories: string[];
    projectMemoryDirs: number;
  };
  mcpServers: {
    count: number;
    names: string[];
  };
  hooks: {
    events: string[];
    totalHookCount: number;
    hasStatusLine: boolean;
  };
  commands: {
    count: number;
    names: string[];
  };
  projects: {
    count: number;
    hasClaudeMd: boolean;
  };
  workflows: {
    hasCronJobs: boolean;
    hasPlugins: boolean;
    pluginNames: string[];
    hasCustomProxy: boolean;
    hasChannels: boolean;
    channelTypes: string[];
  };
}

export type DimensionKey =
  | "automation"
  | "memory"
  | "agentCoverage"
  | "toolIntegrations"
  | "skillBreadth"
  | "workflowDepth";

export interface SignalResult {
  signal: string;
  earned: number;
  max: number;
  met: boolean;
}

export interface DimensionScore {
  dimension: DimensionKey;
  label: string;
  score: number;
  maxScore: number;
  signals: SignalResult[];
}

export type TierLabel =
  | "Beginner"
  | "Intermediate"
  | "Advanced"
  | "Expert"
  | "Master";

export type TierDescription =
  | "Getting Started"
  | "Building Momentum"
  | "Power User"
  | "Ecosystem Architect"
  | "Full Autonomy";

export interface Tier {
  label: TierLabel;
  description: TierDescription;
}

export interface ScoreResult {
  composite: number;
  tier: Tier;
  dimensions: DimensionScore[];
}

export interface NextStep {
  action: string;
  dimension: string;
  pointsGain: number;
}

export interface Report {
  personality: string;
  strengths: { dimension: string; explanation: string }[];
  growthAreas: { dimension: string; suggestion: string }[];
  nextSteps: NextStep[];
}
