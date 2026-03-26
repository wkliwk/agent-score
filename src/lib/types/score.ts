export type DimensionName =
  | "memory"
  | "tools"
  | "instructions"
  | "context"
  | "security"
  | "observability";

export interface SignalResult {
  signal: string;
  passed: boolean;
  weight: number;
  note?: string;
}

export interface DimensionScore {
  dimension: DimensionName;
  score: number;
  maxScore: number;
  signals: SignalResult[];
}

export type TierName = "scout" | "operator" | "architect" | "elite";

export interface ScoreResult {
  totalScore: number;
  maxScore: number;
  tier: TierName;
  dimensions: DimensionScore[];
  scoredAt: string;
}
