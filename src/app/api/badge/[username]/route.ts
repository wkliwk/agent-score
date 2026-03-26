import type { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import type { TierLabel } from "@/lib/scoring/types";

const TIER_COLORS: Record<TierLabel, string> = {
  Master: "#10b981",
  Expert: "#3b82f6",
  Advanced: "#8b5cf6",
  Intermediate: "#f59e0b",
  Beginner: "#6b7280",
};

function buildSvg(scoreText: string, tierColor: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="20">
  <rect width="90" height="20" fill="#555"/>
  <rect x="90" width="70" height="20" fill="${tierColor}"/>
  <text x="45" y="14" fill="white" font-family="sans-serif" font-size="11" text-anchor="middle">AgentScore</text>
  <text x="125" y="14" fill="white" font-family="sans-serif" font-size="11" text-anchor="middle">${scoreText}</text>
</svg>`;
}

// ---------------------------------------------------------------------------
// GET /api/badge/[username] — SVG badge for a user's AgentScore
// ---------------------------------------------------------------------------
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;

  const rows = await db
    .select({ totalScore: profiles.totalScore, tier: profiles.tier })
    .from(profiles)
    .where(eq(profiles.githubLogin, username))
    .limit(1);

  let svg: string;

  if (rows.length === 0 || rows[0].totalScore === null) {
    svg = buildSvg("N/A", "#6b7280");
  } else {
    const { totalScore, tier } = rows[0];
    const tierColor = tier ? (TIER_COLORS[tier as TierLabel] ?? "#6b7280") : "#6b7280";
    svg = buildSvg(`${totalScore} / 10`, tierColor);
  }

  return new Response(svg, {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
