import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import RadarChart from "@/components/RadarChart";
import { getMockProfile } from "@/lib/mock-profiles";
import { dbRowToProfile } from "@/lib/db-to-profile";
import type { MockProfile } from "@/lib/mock-profiles";

interface ComparePageProps {
  searchParams: Promise<{
    a?: string;
    b?: string;
  }>;
}

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://agentscore.dev";

export async function generateMetadata({
  searchParams,
}: ComparePageProps): Promise<Metadata> {
  const { a, b } = await searchParams;
  if (!a || !b) {
    return { title: "Compare Profiles — AgentScore" };
  }
  return {
    title: `Compare @${a} vs @${b} — AgentScore`,
    description: `Side-by-side AgentScore comparison between @${a} and @${b}.`,
    openGraph: {
      title: `Compare @${a} vs @${b} — AgentScore`,
      description: `Side-by-side AgentScore comparison between @${a} and @${b}.`,
      url: `${BASE_URL}/compare?a=${encodeURIComponent(a)}&b=${encodeURIComponent(b)}`,
    },
  };
}

async function fetchProfile(username: string): Promise<MockProfile | null> {
  // Try real DB first; fall back to mock
  try {
    const { getDb } = await import("@/db");
    const { profiles } = await import("@/db/schema");
    const { eq } = await import("drizzle-orm");
    const db = getDb();
    const rows = await db
      .select()
      .from(profiles)
      .where(eq(profiles.githubLogin, username))
      .limit(1);
    if (rows.length > 0) {
      const profile = dbRowToProfile(rows[0]);
      if (profile) return profile;
    }
  } catch {
    // DB unavailable — fall through to mock
  }
  return getMockProfile(username);
}

const TIER_COLORS: Record<string, string> = {
  Master: "#f59e0b",
  Expert: "#f59e0b",
  Advanced: "#8b5cf6",
  Intermediate: "#3b82f6",
  Beginner: "#6b7280",
};

const DIMENSION_ORDER = [
  "automation",
  "memory",
  "agentCoverage",
  "toolIntegrations",
  "skillBreadth",
  "workflowDepth",
];

function TierBadge({ tier }: { tier: string }) {
  const color = TIER_COLORS[tier] ?? "#6b7280";
  return (
    <span
      className="inline-block rounded-full px-2.5 py-0.5 text-xs font-medium"
      style={{ backgroundColor: `${color}18`, color }}
    >
      {tier}
    </span>
  );
}

function ProfileColumn({
  profile,
  color,
  isWinner,
}: {
  profile: MockProfile;
  color: string;
  isWinner: boolean;
}) {
  const tierColor = TIER_COLORS[profile.tier] ?? "#6b7280";
  return (
    <div className="flex flex-col items-center text-center">
      {/* Winner indicator */}
      <div className="h-6 mb-2 flex items-center">
        {isWinner && (
          <span
            className="text-xs font-semibold uppercase tracking-widest px-2 py-0.5 rounded-full"
            style={{ backgroundColor: `${color}20`, color }}
          >
            Winner
          </span>
        )}
      </div>

      {/* Avatar */}
      <div
        className="h-16 w-16 rounded-full overflow-hidden mb-3"
        style={{ boxShadow: `0 0 0 2px ${color}` }}
      >
        <Image
          src={profile.avatarUrl}
          alt={profile.username}
          width={64}
          height={64}
          className="h-full w-full object-cover"
          unoptimized
        />
      </div>

      {/* Username linking to profile */}
      <Link
        href={`/u/${profile.username}`}
        className="font-mono text-lg font-bold hover:underline transition-colors"
        style={{ color }}
      >
        @{profile.username}
      </Link>

      {/* Composite score */}
      <div
        className="text-4xl font-bold mt-2 leading-none"
        style={{ color: tierColor }}
      >
        {profile.composite}
      </div>

      {/* Tier badge */}
      <div className="mt-2">
        <TierBadge tier={profile.tier} />
      </div>
    </div>
  );
}

export default async function ComparePage({ searchParams }: ComparePageProps) {
  const { a, b } = await searchParams;

  // Validate params present
  if (!a || !b) {
    return (
      <div className="flex min-h-screen flex-col overflow-x-hidden">
        <Navbar />
        <main className="flex-1 flex items-center justify-center px-4 py-20">
          <div className="rounded-xl bg-[#12121a] border border-white/10 p-10 text-center max-w-md">
            <h1 className="text-xl font-bold text-white mb-3">Compare Profiles</h1>
            <p className="text-white/50 text-sm">
              Provide two usernames via{" "}
              <span className="font-mono text-indigo-400">?a=username&b=username</span>{" "}
              to compare their AgentScores side by side.
            </p>
          </div>
        </main>
      </div>
    );
  }

  // Fetch both profiles in parallel
  const [profileA, profileB] = await Promise.all([
    fetchProfile(a),
    fetchProfile(b),
  ]);

  // Handle not found
  const notFoundUsernames: string[] = [];
  if (!profileA) notFoundUsernames.push(a);
  if (!profileB) notFoundUsernames.push(b);

  if (notFoundUsernames.length > 0) {
    return (
      <div className="flex min-h-screen flex-col overflow-x-hidden">
        <Navbar />
        <main className="flex-1 flex items-center justify-center px-4 py-20">
          <div className="rounded-xl bg-[#12121a] border border-red-500/20 p-10 text-center max-w-md">
            <h1 className="text-xl font-bold text-white mb-3">Profile Not Found</h1>
            {notFoundUsernames.map((u) => (
              <p key={u} className="text-red-400 text-sm font-mono mb-1">
                Profile not found: {u}
              </p>
            ))}
          </div>
        </main>
      </div>
    );
  }

  // TypeScript: both are non-null after the check above
  const pA = profileA as MockProfile;
  const pB = profileB as MockProfile;

  const isATied = pA.composite === pB.composite;
  const isAWinner = pA.composite > pB.composite;
  const isBWinner = pB.composite > pA.composite;

  // Build dimension delta table in a consistent order
  const dimensionRows = DIMENSION_ORDER.map((key) => {
    const dimA = pA.dimensions.find((d) => d.dimension === key);
    const dimB = pB.dimensions.find((d) => d.dimension === key);
    const scoreA = dimA?.score ?? 0;
    const scoreB = dimB?.score ?? 0;
    const delta = scoreA - scoreB;
    const label = dimA?.label ?? dimB?.label ?? key;
    return { key, label, scoreA, scoreB, delta };
  });

  // Color scheme: indigo for A, amber for B
  const colorA = "#6366f1";
  const colorB = "#f59e0b";

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden">
      <Navbar />

      <main className="flex-1 px-4 py-10 md:py-14">
        <div className="mx-auto max-w-4xl">

          {/* Page title */}
          <div className="text-center mb-10">
            <p className="text-xs uppercase tracking-widest text-white/40 mb-2">
              Profile Comparison
            </p>
            <h1 className="text-2xl font-bold text-white">
              @{a} vs @{b}
            </h1>
          </div>

          {/* Header: two profile columns side by side */}
          <div className="rounded-2xl bg-[#12121a] border border-white/10 p-6 md:p-8 mb-8">
            <div className="grid grid-cols-3 items-start gap-4">
              {/* User A */}
              <ProfileColumn
                profile={pA}
                color={colorA}
                isWinner={isAWinner}
              />

              {/* VS divider */}
              <div className="flex flex-col items-center justify-center py-8">
                <div className="w-px flex-1 bg-white/10" />
                <span className="my-3 text-xs font-mono text-white/30 uppercase tracking-widest">
                  vs
                </span>
                <div className="w-px flex-1 bg-white/10" />
                {isATied && (
                  <span className="mt-2 text-xs text-white/40">Tied</span>
                )}
              </div>

              {/* User B */}
              <ProfileColumn
                profile={pB}
                color={colorB}
                isWinner={isBWinner}
              />
            </div>
          </div>

          {/* Overlaid radar chart */}
          <div className="rounded-2xl bg-[#12121a] border border-white/10 p-6 mb-8">
            <h2 className="text-sm uppercase tracking-widest text-white/40 mb-4">
              Dimension Radar
            </h2>
            <RadarChart
              dimensions={pA.dimensions}
              secondDimensions={pB.dimensions}
              labelA={`@${a}`}
              labelB={`@${b}`}
              size="hero"
            />
          </div>

          {/* Delta table */}
          <div className="rounded-2xl bg-[#12121a] border border-white/10 overflow-hidden mb-8">
            <div className="px-6 py-4 border-b border-white/10">
              <h2 className="text-sm uppercase tracking-widest text-white/40">
                Dimension Breakdown
              </h2>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="px-6 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">
                    Dimension
                  </th>
                  <th
                    className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider"
                    style={{ color: colorA }}
                  >
                    @{a}
                  </th>
                  <th
                    className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider"
                    style={{ color: colorB }}
                  >
                    @{b}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-white/40 uppercase tracking-wider">
                    Delta
                  </th>
                </tr>
              </thead>
              <tbody>
                {dimensionRows.map(({ key, label, scoreA, scoreB, delta }) => {
                  const aWins = delta > 0;
                  const bWins = delta < 0;
                  return (
                    <tr
                      key={key}
                      className="border-b border-white/5 last:border-0 transition-colors hover:bg-white/5"
                    >
                      <td className="px-6 py-3 text-white/70 font-medium">
                        {label}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`font-mono font-bold ${aWins ? "text-white" : "text-white/40"}`}
                        >
                          {scoreA}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`font-mono font-bold ${bWins ? "text-white" : "text-white/40"}`}
                        >
                          {scoreB}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-right">
                        {delta === 0 ? (
                          <span className="text-white/30 font-mono text-xs">Tied</span>
                        ) : (
                          <span
                            className="font-mono text-xs font-semibold px-2 py-0.5 rounded"
                            style={
                              aWins
                                ? {
                                    backgroundColor: `${colorA}18`,
                                    color: colorA,
                                  }
                                : {
                                    backgroundColor: `${colorB}18`,
                                    color: colorB,
                                  }
                            }
                          >
                            {aWins ? "+" : ""}{delta.toFixed(1)} {aWins ? `@${a}` : `@${b}`} wins
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Links back to full profiles */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href={`/u/${a}`}
              className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium border transition-colors"
              style={{
                borderColor: `${colorA}50`,
                color: colorA,
              }}
            >
              View @{a}&apos;s full profile
            </Link>
            <Link
              href={`/u/${b}`}
              className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium border transition-colors"
              style={{
                borderColor: `${colorB}50`,
                color: colorB,
              }}
            >
              View @{b}&apos;s full profile
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 px-4 py-6 mt-10">
        <div className="mx-auto max-w-7xl text-center text-xs text-white/30">
          AgentScore —{" "}
          <a
            href="https://github.com/wkliwk"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white/60 transition-colors"
          >
            @wkliwk
          </a>
        </div>
      </footer>
    </div>
  );
}
