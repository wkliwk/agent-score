import type { DimensionName } from "./score";

export interface StrengthItem {
  dimension: DimensionName;
  title: string;
  description: string;
}

export interface GrowthItem {
  dimension: DimensionName;
  title: string;
  description: string;
  impact: "low" | "medium" | "high";
}

export interface NextStep {
  priority: number;
  action: string;
  rationale: string;
  estimatedGain: number;
}

export interface Report {
  strengths: StrengthItem[];
  growthAreas: GrowthItem[];
  nextSteps: NextStep[];
  summary: string;
}
