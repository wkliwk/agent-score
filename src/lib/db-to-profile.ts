import type { MockProfile, MockDimensionScore } from "./mock-profiles";
import type { ScoreResult } from "./scoring/types";
import type { AgentScoreManifest } from "./scoring/types";
import { generateReport } from "./scoring/report";

interface DbProfileRow {
  githubLogin: string;
  avatarUrl: string | null;
  totalScore: number | null;
  tier: string | null;
  dimensionScores: unknown;
  manifestSnapshot: unknown;
}

const TIER_DESCRIPTIONS: Record<string, string> = {
  Beginner: "Getting Started",
  Intermediate: "Building Momentum",
  Advanced: "Power User",
  Expert: "Ecosystem Architect",
  Master: "Full Autonomy",
};

/**
 * Convert a DB profile row into the MockProfile shape used by ProfileCard and ProfilePage.
 * Returns null if the row lacks scored data.
 */
export function dbRowToProfile(row: DbProfileRow): MockProfile | null {
  const scoreResult = row.dimensionScores as ScoreResult | null;
  const manifest = row.manifestSnapshot as AgentScoreManifest | null;

  if (!scoreResult?.dimensions || !scoreResult.composite) return null;

  const dimensions: MockDimensionScore[] = scoreResult.dimensions.map((d) => ({
    dimension: d.dimension,
    score: d.score,
    maxScore: d.maxScore,
    label: d.label,
    signals: d.signals.map((s) => ({
      signal: s.signal,
      met: s.met,
      earned: s.earned,
      max: s.max,
    })),
  }));

  const report = manifest ? generateReport(manifest, scoreResult) : null;

  return {
    username: row.githubLogin,
    avatarUrl: row.avatarUrl ?? `https://github.com/${row.githubLogin}.png`,
    composite: scoreResult.composite,
    tier: (row.tier ?? "Beginner") as MockProfile["tier"],
    tierDescription: (TIER_DESCRIPTIONS[row.tier ?? "Beginner"] ??
      "Getting Started") as MockProfile["tierDescription"],
    personality: report?.personality ?? "",
    dimensions,
    agents: manifest?.agents.names ?? [],
    mcpServers: manifest?.mcpServers.names ?? [],
    commands: manifest?.commands.names ?? [],
    hooks: manifest?.hooks.events ?? [],
    strengths: report?.strengths ?? [],
    growthAreas: report?.growthAreas ?? [],
    nextSteps: report?.nextSteps ?? [],
  };
}
