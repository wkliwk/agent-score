import type { ScoreResult } from "./score";
import type { Report } from "./report";
import type { AgentScoreManifest } from "./manifest";

export type ProfileVisibility = "public" | "unlisted";

export interface Profile {
  id: string;
  githubId: string;
  githubLogin: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  visibility: ProfileVisibility;
  scoreResult: ScoreResult | null;
  report: Report | null;
  manifestSnapshot: AgentScoreManifest | null;
  scoredAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProfileSummary {
  id: string;
  githubLogin: string;
  displayName: string;
  avatarUrl: string | null;
  totalScore: number | null;
  tier: string | null;
  scoredAt: string | null;
}
