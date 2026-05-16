import Link from "next/link";
import type { TierLabel } from "@/lib/scoring/types";
import type { MockProfile } from "@/lib/mock-profiles";
import { MOCK_PROFILES } from "@/lib/mock-profiles";

// ------------------------------------------------------------------
// Data types
// ------------------------------------------------------------------

interface TopScorerRow {
  rank: number;
  username: string;
  avatarUrl: string;
  score: number;
  tier: TierLabel;
}

// ------------------------------------------------------------------
// Tier badge helpers — mirrors ProfileCard colour palette
// ------------------------------------------------------------------

const TIER_COLORS: Record<TierLabel, { bg: string; text: string }> = {
  Master: { bg: "rgba(245,158,11,0.12)", text: "#f59e0b" },
  Expert: { bg: "rgba(245,158,11,0.12)", text: "#f59e0b" },
  Advanced: { bg: "rgba(139,92,246,0.12)", text: "#8b5cf6" },
  Intermediate: { bg: "rgba(59,130,246,0.12)", text: "#3b82f6" },
  Beginner: { bg: "rgba(107,114,128,0.12)", text: "#6b7280" },
};

function TierBadge({ tier }: { tier: TierLabel }) {
  const { bg, text } = TIER_COLORS[tier] ?? TIER_COLORS.Beginner;
  return (
    <span
      className="rounded px-1.5 py-0.5 text-xs font-medium whitespace-nowrap"
      style={{ backgroundColor: bg, color: text }}
    >
      {tier}
    </span>
  );
}

// ------------------------------------------------------------------
// Rank label — gold / silver / bronze for top 3, plain otherwise
// ------------------------------------------------------------------

const MEDAL_STYLES: Record<number, { color: string; label: string }> = {
  1: { color: "#f59e0b", label: "#1" },
  2: { color: "#9ca3af", label: "#2" },
  3: { color: "#b45309", label: "#3" },
};

function RankLabel({ rank }: { rank: number }) {
  const medal = MEDAL_STYLES[rank];
  if (medal) {
    return (
      <span
        className="text-sm font-bold tabular-nums"
        style={{ color: medal.color }}
      >
        {medal.label}
      </span>
    );
  }
  return (
    <span className="text-sm font-mono text-white/40 tabular-nums">
      #{rank}
    </span>
  );
}

// ------------------------------------------------------------------
// Row background tints for top 3
// ------------------------------------------------------------------

function rowClass(rank: number): string {
  if (rank === 1) return "bg-amber-500/5 border-b border-white/5";
  if (rank === 2) return "bg-gray-400/5 border-b border-white/5";
  if (rank === 3) return "bg-amber-800/5 border-b border-white/5";
  return "border-b border-white/5 last:border-b-0";
}

// ------------------------------------------------------------------
// DB fetch
// ------------------------------------------------------------------

async function fetchTopScorers(): Promise<TopScorerRow[] | null> {
  try {
    const { getDb } = await import("@/db");
    const { profiles: profilesTable } = await import("@/db/schema");
    const { desc, eq, isNotNull, and } = await import("drizzle-orm");

    const db = getDb();

    const rows = await db
      .select({
        githubLogin: profilesTable.githubLogin,
        avatarUrl: profilesTable.avatarUrl,
        totalScore: profilesTable.totalScore,
        tier: profilesTable.tier,
        scoredAt: profilesTable.scoredAt,
      })
      .from(profilesTable)
      .where(
        and(
          eq(profilesTable.visibility, "public"),
          isNotNull(profilesTable.totalScore),
          isNotNull(profilesTable.scoredAt)
        )
      )
      .orderBy(desc(profilesTable.totalScore), desc(profilesTable.scoredAt))
      .limit(10);

    if (rows.length === 0) return null;

    return rows.map((row, i) => ({
      rank: i + 1,
      username: row.githubLogin,
      avatarUrl: row.avatarUrl ?? `https://github.com/${row.githubLogin}.png`,
      score: row.totalScore ?? 0,
      tier: (row.tier ?? "Beginner") as TierLabel,
    }));
  } catch {
    return null;
  }
}

// ------------------------------------------------------------------
// Mock fallback — top 10 from MOCK_PROFILES sorted by composite
// ------------------------------------------------------------------

function mockTopScorers(): TopScorerRow[] {
  return [...MOCK_PROFILES]
    .sort((a: MockProfile, b: MockProfile) => b.composite - a.composite)
    .slice(0, 10)
    .map((p: MockProfile, i) => ({
      rank: i + 1,
      username: p.username,
      avatarUrl: p.avatarUrl,
      score: p.composite,
      tier: p.tier,
    }));
}

// ------------------------------------------------------------------
// Component
// ------------------------------------------------------------------

export default async function TopScorers() {
  const dbRows = await fetchTopScorers();
  const scorers = dbRows ?? mockTopScorers();

  if (scorers.length === 0) return null;

  return (
    <section className="mb-10" aria-label="Top Scorers leaderboard">
      <h2 className="text-lg font-semibold text-white mb-3">Top Scorers</h2>

      <div className="rounded-xl border border-white/10 bg-[#12121a] overflow-hidden">
        <table className="w-full text-sm" aria-label="Top 10 profiles by score">
          <thead>
            <tr className="border-b border-white/10">
              <th
                scope="col"
                className="w-10 px-4 py-2.5 text-left text-xs font-medium text-white/40 uppercase tracking-wide"
              >
                Rank
              </th>
              {/* Avatar column — hidden on mobile */}
              <th
                scope="col"
                className="hidden sm:table-cell w-10 px-2 py-2.5"
                aria-label="Avatar"
              />
              <th
                scope="col"
                className="px-3 py-2.5 text-left text-xs font-medium text-white/40 uppercase tracking-wide"
              >
                User
              </th>
              <th
                scope="col"
                className="px-3 py-2.5 text-right text-xs font-medium text-white/40 uppercase tracking-wide"
              >
                Score
              </th>
              <th
                scope="col"
                className="px-4 py-2.5 text-right text-xs font-medium text-white/40 uppercase tracking-wide"
              >
                Tier
              </th>
            </tr>
          </thead>
          <tbody>
            {scorers.map((row) => (
              <tr key={row.username} className={rowClass(row.rank)}>
                {/* Rank */}
                <td className="px-4 py-3 text-center">
                  <RankLabel rank={row.rank} />
                </td>

                {/* Avatar — hidden on mobile */}
                <td className="hidden sm:table-cell px-2 py-3">
                  {/* eslint-disable-next-line @next/next-eslint/no-img-element */}
                  <img
                    src={row.avatarUrl}
                    alt=""
                    aria-hidden="true"
                    width={28}
                    height={28}
                    className="h-7 w-7 rounded-full bg-white/10 object-cover"
                  />
                </td>

                {/* Username */}
                <td className="px-3 py-3">
                  <Link
                    href={`/u/${row.username}`}
                    className="font-mono text-sm font-medium text-white hover:text-indigo-300 transition-colors"
                  >
                    @{row.username}
                  </Link>
                </td>

                {/* Score */}
                <td className="px-3 py-3 text-right">
                  <span className="font-bold tabular-nums text-white">
                    {row.score.toFixed(1)}
                  </span>
                </td>

                {/* Tier badge */}
                <td className="px-4 py-3 text-right">
                  <TierBadge tier={row.tier} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
