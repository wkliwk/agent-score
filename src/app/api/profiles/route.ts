import type { NextRequest } from "next/server";
import { eq, desc, gte, and, ilike } from "drizzle-orm";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import { scoreManifest } from "@/lib/scoring/engine";
import { generateReport } from "@/lib/scoring/report";
import { agentScoreManifestSchema } from "@/lib/validation/manifest.schema";
import { checkRateLimit } from "@/lib/rate-limit";
import { auth } from "@/auth";
import type { DimensionKey } from "@/lib/scoring/types";

// ---------------------------------------------------------------------------
// POST /api/profiles — submit a manifest and create/update a profile
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const githubId = session.user.id;

  if (!checkRateLimit(githubId, 10)) {
    return Response.json(
      { error: "Rate limit exceeded. Max 10 submissions per hour." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (typeof body !== "object" || body === null) {
    return Response.json({ error: "Request body must be an object" }, { status: 400 });
  }

  const { manifest: rawManifest, visibility } = body as Record<string, unknown>;

  const parsed = agentScoreManifestSchema.safeParse(rawManifest);
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid manifest", details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const resolvedVisibility =
    visibility === "unlisted" ? "unlisted" : "public";

  const manifest = parsed.data;

  const scoreResult = scoreManifest(manifest);
  const report = generateReport(manifest, scoreResult);

  const now = new Date();

  // Upsert: match on githubId
  const existing = await db
    .select({ id: profiles.id })
    .from(profiles)
    .where(eq(profiles.githubId, githubId))
    .limit(1);

  let profileId: string;

  if (existing.length > 0) {
    const rows = await db
      .update(profiles)
      .set({
        githubLogin: manifest.github,
        displayName: manifest.username,
        visibility: resolvedVisibility,
        totalScore: scoreResult.composite,
        tier: scoreResult.tier.label,
        dimensionScores: scoreResult as unknown as Record<string, unknown>,
        manifestSnapshot: manifest as unknown as Record<string, unknown>,
        scoredAt: now,
        updatedAt: now,
      })
      .where(eq(profiles.githubId, githubId))
      .returning({ id: profiles.id });
    profileId = rows[0].id;
  } else {
    const rows = await db
      .insert(profiles)
      .values({
        githubId,
        githubLogin: manifest.github,
        displayName: manifest.username,
        avatarUrl: session.user.image ?? null,
        visibility: resolvedVisibility,
        totalScore: scoreResult.composite,
        tier: scoreResult.tier.label,
        dimensionScores: scoreResult as unknown as Record<string, unknown>,
        manifestSnapshot: manifest as unknown as Record<string, unknown>,
        scoredAt: now,
      })
      .returning({ id: profiles.id });
    profileId = rows[0].id;
  }

  const profileUrl = `/profile/${manifest.github}`;

  return Response.json(
    {
      profile: {
        id: profileId,
        githubLogin: manifest.github,
        displayName: manifest.username,
        visibility: resolvedVisibility,
        scoreResult,
        report,
      },
      profileUrl,
    },
    { status: existing.length > 0 ? 200 : 201 }
  );
}

// ---------------------------------------------------------------------------
// GET /api/profiles — discovery feed
// ---------------------------------------------------------------------------
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
  const minScore = searchParams.get("minScore")
    ? parseFloat(searchParams.get("minScore")!)
    : undefined;
  const topDimension = searchParams.get("topDimension") as DimensionKey | null;
  const sort = searchParams.get("sort") === "score" ? "score" : "newest";
  const search = searchParams.get("search")?.trim() ?? "";

  const offset = (page - 1) * limit;

  const conditions = [eq(profiles.visibility, "public")];
  if (minScore !== undefined && !isNaN(minScore)) {
    conditions.push(gte(profiles.totalScore, minScore));
  }
  if (search.length >= 2) {
    conditions.push(ilike(profiles.githubLogin, `${search}%`));
  }

  const whereClause = and(...conditions);

  const orderBy =
    sort === "score"
      ? desc(profiles.totalScore)
      : desc(profiles.createdAt);

  const rows = await db
    .select({
      id: profiles.id,
      githubLogin: profiles.githubLogin,
      displayName: profiles.displayName,
      avatarUrl: profiles.avatarUrl,
      totalScore: profiles.totalScore,
      tier: profiles.tier,
      dimensionScores: profiles.dimensionScores,
      scoredAt: profiles.scoredAt,
    })
    .from(profiles)
    .where(whereClause)
    .orderBy(orderBy)
    .limit(limit)
    .offset(offset);

  // Filter by topDimension in application layer (avoids complex jsonb SQL for MVP)
  let filtered = rows;
  if (topDimension) {
    filtered = rows.filter((row) => {
      const ds = row.dimensionScores as {
        dimensions?: { dimension: string; score: number }[];
      } | null;
      if (!ds?.dimensions) return false;
      const sorted = [...ds.dimensions].sort((a, b) => b.score - a.score);
      return sorted[0]?.dimension === topDimension;
    });
  }

  const summaries = filtered.map((row) => ({
    id: row.id,
    githubLogin: row.githubLogin,
    displayName: row.displayName,
    avatarUrl: row.avatarUrl ?? null,
    totalScore: row.totalScore ?? null,
    tier: row.tier ?? null,
    dimensionScores: row.dimensionScores ?? null,
    scoredAt: row.scoredAt?.toISOString() ?? null,
  }));

  return Response.json({
    data: summaries,
    page,
    limit,
    hasMore: rows.length === limit,
  });
}
