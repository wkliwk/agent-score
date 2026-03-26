import type { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { profiles } from "@/db/schema";

// ---------------------------------------------------------------------------
// GET /api/profiles/[username] — public profile by GitHub login
// ---------------------------------------------------------------------------
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;

  const rows = await db
    .select()
    .from(profiles)
    .where(eq(profiles.githubLogin, username))
    .limit(1);

  if (rows.length === 0) {
    return Response.json({ error: "Profile not found" }, { status: 404 });
  }

  const row = rows[0];

  return Response.json({
    id: row.id,
    githubLogin: row.githubLogin,
    displayName: row.displayName,
    avatarUrl: row.avatarUrl,
    bio: row.bio,
    visibility: row.visibility,
    totalScore: row.totalScore,
    tier: row.tier,
    dimensionScores: row.dimensionScores,
    manifestSnapshot: row.manifestSnapshot,
    scoredAt: row.scoredAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  });
}
