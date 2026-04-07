import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import {
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  GitFork,
  ClipboardCheck,
  FileCode2,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import RadarChart from "@/components/RadarChart";
import ShareButton from "@/components/ShareButton";
import FullReport from "@/components/FullReport";
import LevelUp from "@/components/LevelUp";
import DownloadInfographic from "@/components/DownloadInfographic";
import ScoreHistory from "@/components/ScoreHistory";
import { getMockProfile } from "@/lib/mock-profiles";
import { dbRowToProfile } from "@/lib/db-to-profile";
import type { MockDimensionScore } from "@/lib/mock-profiles";

interface ProfilePageProps {
  params: Promise<{ username: string }>;
}

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://agentscore.dev";

async function fetchDbProfile(username: string) {
  try {
    const { getDb } = await import("@/db");
    const { profiles } = await import("@/db/schema");
    const { eq } = await import("drizzle-orm");
    const db = getDb();
    const rows = await db.select().from(profiles).where(eq(profiles.githubLogin, username)).limit(1);
    if (rows.length === 0) return null;
    return dbRowToProfile(rows[0]);
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: ProfilePageProps): Promise<Metadata> {
  const { username } = await params;
  const profile = (await fetchDbProfile(username)) ?? getMockProfile(username);
  if (!profile) return { title: "Profile not found" };

  const ogUrl = `${BASE_URL}/api/og/${username}`;
  const title = `@${username} — AgentScore ${profile.composite} (${profile.tier})`;
  const description = profile.personality;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "profile",
      url: `${BASE_URL}/u/${username}`,
      images: [{ url: ogUrl, width: 1200, height: 630, alt: `AgentScore for @${username}` }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogUrl],
    },
  };
}

const TIER_COLORS: Record<string, string> = {
  Master: "#f59e0b",
  Expert: "#f59e0b",
  Advanced: "#8b5cf6",
  Intermediate: "#3b82f6",
  Beginner: "#6b7280",
};

const DIM_COLORS: Record<string, string> = {
  automation: "#3b82f6",
  memory: "#10b981",
  agentCoverage: "#8b5cf6",
  toolIntegrations: "#f59e0b",
  skillBreadth: "#f43f5e",
  workflowDepth: "#06b6d4",
};

function ScoreBar({ score, color }: { score: number; color: string }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
      <div
        className="h-full rounded-full transition-all"
        style={{ width: `${(score / 10) * 100}%`, backgroundColor: color }}
      />
    </div>
  );
}

function DimensionCard({ dim }: { dim: MockDimensionScore }) {
  const color = DIM_COLORS[dim.dimension] ?? "#6b7280";
  return (
    <div
      className="rounded-xl bg-[#12121a] border border-white/10 p-5"
      style={{ borderTopColor: color, borderTopWidth: 2 }}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-white text-sm">{dim.label}</h3>
        <span className="font-mono font-bold text-sm" style={{ color }}>
          {dim.score}/10
        </span>
      </div>
      <ScoreBar score={dim.score} color={color} />
      <ul className="mt-4 space-y-1.5">
        {dim.signals.map((sig) => (
          <li key={sig.signal} className="flex items-center gap-2 text-xs">
            {sig.met ? (
              <CheckCircle2 size={13} className="shrink-0 text-emerald-500" />
            ) : (
              <span className="h-3.5 w-3.5 shrink-0 rounded-full border border-white/20" />
            )}
            <span className={sig.met ? "text-white/70" : "text-white/30"}>
              {sig.signal}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

async function fetchScoreHistory(
  username: string
): Promise<{ count: number; previousScore: number | null; scoredAt: string | null }> {
  try {
    const { getDb } = await import("@/db");
    const { profiles, scoreHistory } = await import("@/db/schema");
    const { eq, desc } = await import("drizzle-orm");
    const db = getDb();

    // Get profile ID
    const profileRows = await db
      .select({ id: profiles.id, scoredAt: profiles.scoredAt })
      .from(profiles)
      .where(eq(profiles.githubLogin, username))
      .limit(1);
    if (profileRows.length === 0)
      return { count: 0, previousScore: null, scoredAt: null };

    const profileId = profileRows[0].id;
    const scoredAt = profileRows[0].scoredAt?.toISOString() ?? null;

    // Get the two most recent score history entries
    const historyRows = await db
      .select({ totalScore: scoreHistory.totalScore })
      .from(scoreHistory)
      .where(eq(scoreHistory.profileId, profileId))
      .orderBy(desc(scoreHistory.scoredAt))
      .limit(2);

    return {
      count: historyRows.length,
      previousScore: historyRows.length >= 2 ? historyRows[1].totalScore : null,
      scoredAt,
    };
  } catch {
    return { count: 0, previousScore: null, scoredAt: null };
  }
}

async function getAuthenticatedGithubId(): Promise<string | null> {
  try {
    const { auth } = await import("@/auth");
    const session = await auth();
    return session?.user?.id ?? null;
  } catch {
    return null;
  }
}

async function getProfileGithubId(username: string): Promise<string | null> {
  try {
    const { getDb } = await import("@/db");
    const { profiles } = await import("@/db/schema");
    const { eq } = await import("drizzle-orm");
    const db = getDb();
    const rows = await db
      .select({ githubId: profiles.githubId })
      .from(profiles)
      .where(eq(profiles.githubLogin, username))
      .limit(1);
    return rows[0]?.githubId ?? null;
  } catch {
    return null;
  }
}

async function hasBundle(username: string): Promise<boolean> {
  try {
    const { getDb } = await import("@/db");
    const { bundles } = await import("@/db/schema");
    const { eq } = await import("drizzle-orm");
    const db = getDb();
    const rows = await db.select({ id: bundles.id }).from(bundles).where(eq(bundles.username, username.toLowerCase())).limit(1);
    return rows.length > 0;
  } catch {
    return false;
  }
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { username } = await params;

  // Try real DB first; fall back to mock
  const profile = (await fetchDbProfile(username)) ?? getMockProfile(username);
  const [bundleExists, history, authGithubId, profileGithubId] =
    await Promise.all([
      hasBundle(username),
      fetchScoreHistory(username),
      getAuthenticatedGithubId(),
      getProfileGithubId(username),
    ]);
  const isOwner =
    authGithubId !== null &&
    profileGithubId !== null &&
    authGithubId === profileGithubId;

  if (!profile) {
    notFound();
  }

  const tierColor = TIER_COLORS[profile.tier] ?? "#6b7280";
  const isMaster = profile.tier === "Master";

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1 px-4 py-10 md:py-14">
        <div className="mx-auto max-w-5xl">

          {/* Profile header */}
          <div className="flex flex-col items-center text-center mb-10">
            <div className="h-16 w-16 rounded-full overflow-hidden bg-white/10 mb-4">
              <Image
                src={profile.avatarUrl}
                alt={profile.username}
                width={64}
                height={64}
                className="h-full w-full object-cover"
                unoptimized
              />
            </div>
            <h1 className="font-mono text-2xl font-bold text-white">
              @{profile.username}
            </h1>
            <a
              href={`https://github.com/${profile.username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-flex items-center gap-1 text-sm text-white/50 hover:text-white transition-colors"
            >
              <GitFork size={13} />
              github.com/{profile.username}
              <ArrowUpRight size={11} />
            </a>
          </div>

          {/* Hero chart + score card */}
          <div className="flex flex-col items-center gap-6 mb-14">
            <div className="rounded-2xl bg-[#12121a] border border-white/10 p-6 w-full max-w-lg">
              <RadarChart dimensions={profile.dimensions} size="hero" />
            </div>

            {/* Score card */}
            <div className="w-full max-w-sm rounded-xl bg-[#12121a] border border-white/10 p-6 text-center">
              <p className="text-xs uppercase tracking-widest text-white/40 mb-1">
                AgentScore
              </p>
              <div
                className="text-7xl font-bold leading-none tracking-tight"
                style={
                  isMaster
                    ? {
                        background: "linear-gradient(90deg, #f59e0b, #f43f5e)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                      }
                    : { color: tierColor }
                }
              >
                {profile.composite}
              </div>
              <div
                className="mt-2 inline-block rounded-full px-3 py-1 text-sm font-medium"
                style={{ backgroundColor: `${tierColor}18`, color: tierColor }}
              >
                {profile.tier} — {profile.tierDescription}
              </div>
              <ScoreHistory
                scoredAt={history.scoredAt}
                previousScore={history.previousScore}
                currentScore={profile.composite}
                historyCount={history.count}
                isOwner={isOwner}
                username={profile.username}
              />
              <div className="mt-4 flex items-center justify-center gap-3">
                <ShareButton username={profile.username} />
                <DownloadInfographic username={profile.username} />
              </div>
            </div>
          </div>

          {/* Bundle stats */}
          {profile.bundle && (
            <div className="flex items-center justify-center gap-6 mb-10">
              <div className="flex items-center gap-2 text-sm text-white/50">
                <GitFork size={14} className="text-indigo-400" />
                <span className="font-mono text-white/70">{profile.bundle.importCount}</span>
                <span>imports</span>
              </div>
              <div className="h-3 w-px bg-white/10" />
              <div className="flex items-center gap-2 text-sm text-white/50">
                <span className="font-mono text-white/70">{profile.bundle.inspiredByCount}</span>
                <span>users inspired</span>
              </div>
              <div className="h-3 w-px bg-white/10" />
              <div className="flex items-center gap-2 text-sm text-white/50">
                <span className="font-mono text-white/70">{profile.bundle.fileCount}</span>
                <span>files shared</span>
              </div>
            </div>
          )}

          {/* Report section */}
          <div className="mx-auto max-w-3xl space-y-8 mb-14">
            {/* Personality */}
            <div className="rounded-xl bg-[#12121a] border border-indigo-500/20 p-6">
              <h2 className="text-xs uppercase tracking-widest text-indigo-400 mb-3">
                Ecosystem Personality
              </h2>
              <p className="text-white/80 italic text-lg leading-relaxed">
                &ldquo;{profile.personality}&rdquo;
              </p>
            </div>

            {/* Strengths */}
            {profile.strengths.length > 0 && (
              <div>
                <h2 className="text-xs uppercase tracking-widest text-emerald-400 mb-4">
                  Strengths
                </h2>
                <div className="space-y-3">
                  {profile.strengths.map((s) => {
                    const dim = profile!.dimensions.find(
                      (d) => d.label === s.dimension
                    );
                    return (
                      <div
                        key={s.dimension}
                        className="flex gap-3 rounded-xl bg-[#12121a] border border-emerald-500/20 p-4"
                      >
                        <CheckCircle2 size={18} className="text-emerald-500 shrink-0 mt-0.5" />
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-white text-sm">
                              {s.dimension}
                            </span>
                            {dim && (
                              <span className="rounded px-1.5 py-0.5 text-xs font-mono bg-emerald-500/10 text-emerald-400">
                                {dim.score}/10
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-white/55">{s.explanation}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Growth Areas */}
            {profile.growthAreas.length > 0 && (
              <div>
                <h2 className="text-xs uppercase tracking-widest text-amber-400 mb-4">
                  Growth Areas
                </h2>
                <div className="space-y-3">
                  {profile.growthAreas.map((g) => {
                    const dim = profile!.dimensions.find(
                      (d) => d.label === g.dimension
                    );
                    return (
                      <div
                        key={g.dimension}
                        className="flex gap-3 rounded-xl bg-[#12121a] border border-amber-500/20 p-4"
                      >
                        <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-white text-sm">
                              {g.dimension}
                            </span>
                            {dim && (
                              <span className="rounded px-1.5 py-0.5 text-xs font-mono bg-amber-500/10 text-amber-400">
                                {dim.score}/10
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-white/55">{g.suggestion}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Next Steps */}
            {profile.nextSteps.length > 0 && (
              <div>
                <h2 className="text-xs uppercase tracking-widest text-indigo-400 mb-4">
                  Next Steps
                </h2>
                <div className="space-y-2">
                  {profile.nextSteps.map((step, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 rounded-xl bg-[#12121a] border border-white/10 p-4"
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-500/15 text-xs font-bold text-indigo-400">
                        {i + 1}
                      </span>
                      <span className="flex-1 text-sm text-white/70">{step.action}</span>
                      <span className="shrink-0 rounded px-2 py-0.5 text-xs font-mono bg-emerald-500/10 text-emerald-400">
                        +{step.pointsGain} pts
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Full Report (collapsible) */}
          <div className="mx-auto max-w-3xl mb-14">
            <FullReport profile={profile} />
          </div>

          {/* Level Up — improvement roadmap */}
          <div className="mx-auto max-w-3xl mb-14">
            <LevelUp profile={profile} />
          </div>

          {/* Dimension breakdown */}
          <div className="mb-14">
            <h2 className="text-lg font-semibold text-white mb-6">
              Score Breakdown
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {profile.dimensions.map((dim) => (
                <DimensionCard key={dim.dimension} dim={dim} />
              ))}
            </div>
          </div>

          {/* Published Setup link */}
          {bundleExists && (
            <div className="rounded-xl bg-[#12121a] border border-indigo-500/20 p-6 mb-10">
              <div className="flex items-center gap-3 mb-3">
                <FileCode2 size={20} className="text-indigo-400" />
                <h2 className="text-lg font-semibold text-white">
                  Full Setup Published
                </h2>
              </div>
              <p className="text-sm text-white/50 mb-4">
                @{username} has shared their complete Claude Code setup — agents,
                commands, and configuration files.
              </p>
              <Link
                href={`/u/${username}/setup`}
                className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-500 transition-colors"
              >
                <FileCode2 size={14} />
                View Full Setup
              </Link>
            </div>
          )}

          {/* Benchmark CTA */}
          <div className="rounded-xl bg-[#12121a] border border-cyan-500/20 p-6 mb-10">
            <div className="flex items-center gap-3 mb-3">
              <ClipboardCheck size={20} className="text-cyan-400" />
              <h2 className="text-lg font-semibold text-white">
                Benchmark Your Setup
              </h2>
            </div>
            <p className="text-sm text-white/50 mb-4">
              Config scoring tells you what you have — benchmarking tells you if
              it works. Run 6 standardized tasks and get graded.
            </p>
            <Link
              href="/benchmark"
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium bg-cyan-600 text-white hover:bg-cyan-500 transition-colors"
            >
              <ClipboardCheck size={14} />
              Take the Benchmark
            </Link>
          </div>

          {/* Manifest Overview */}
          <div className="rounded-xl bg-[#12121a] border border-white/10 p-6 mb-10">
            <h2 className="text-lg font-semibold text-white mb-6">
              Manifest Overview
            </h2>
            <div className="space-y-5">
              <ManifestSection
                title={`Agents (${profile.agents.length})`}
                items={profile.agents}
              />
              <ManifestSection
                title={`MCP Servers (${profile.mcpServers.length})`}
                items={profile.mcpServers}
              />
              <ManifestSection
                title={`Commands (${profile.commands.length})`}
                items={profile.commands}
              />
              {profile.hooks.length > 0 && (
                <ManifestSection
                  title={`Hooks (${profile.hooks.length})`}
                  items={profile.hooks}
                />
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 px-4 py-6">
        <div className="mx-auto max-w-7xl text-center text-xs text-white/30">
          AgentScore — Built by{" "}
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

function ManifestSection({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h3 className="text-xs uppercase tracking-widest text-white/40 mb-2">
        {title}
      </h3>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item) => (
          <span
            key={item}
            className="inline-block rounded px-2 py-0.5 text-xs font-mono bg-white/5 text-white/60 border border-white/10"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
