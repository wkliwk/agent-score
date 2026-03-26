import type { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import type { ScoreResult, Report } from "@/lib/scoring/types";

// ---------------------------------------------------------------------------
// GET /api/scores/[username] — score + report for a user
// ---------------------------------------------------------------------------
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;

  const rows = await db
    .select({
      dimensionScores: profiles.dimensionScores,
      tier: profiles.tier,
      totalScore: profiles.totalScore,
    })
    .from(profiles)
    .where(eq(profiles.githubLogin, username))
    .limit(1);

  if (rows.length === 0) {
    return Response.json({ error: "Profile not found" }, { status: 404 });
  }

  const row = rows[0];

  // dimensionScores column stores the full ScoreResult + report together
  const stored = row.dimensionScores as (ScoreResult & { report?: Report }) | null;

  if (!stored) {
    return Response.json({ error: "Score data not available" }, { status: 404 });
  }

  const score: ScoreResult = {
    composite: stored.composite,
    tier: stored.tier,
    dimensions: stored.dimensions,
  };

  const report: Report | null = stored.report ?? null;

  return Response.json({ score, report });
}
