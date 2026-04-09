import Link from "next/link";
import Image from "next/image";
import {
  Zap,
  Brain,
  Users,
  Wrench,
  BookOpen,
  GitBranch,
  Terminal,
  BarChart3,
  Share2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import RadarChart from "@/components/RadarChart";
import CopyButton from "@/components/CopyButton";
import TerminalAnimation from "@/components/TerminalAnimation";
import { MOCK_PROFILES } from "@/lib/mock-profiles";

const DIMENSIONS = [
  {
    key: "automation",
    label: "Automation",
    description: "Hooks, cron jobs, and event-driven pipelines in your setup.",
    icon: Zap,
    color: "#3b82f6",
  },
  {
    key: "memory",
    label: "Memory",
    description: "How well your agent remembers context across sessions.",
    icon: Brain,
    color: "#10b981",
  },
  {
    key: "agentCoverage",
    label: "Agent Coverage",
    description: "Specialized agents covering every role in your workflow.",
    icon: Users,
    color: "#8b5cf6",
  },
  {
    key: "toolIntegrations",
    label: "Tool Integrations",
    description: "MCP servers and external tools your agents can reach.",
    icon: Wrench,
    color: "#f59e0b",
  },
  {
    key: "skillBreadth",
    label: "Skill Breadth",
    description: "Custom commands and domain-specific capabilities defined.",
    icon: BookOpen,
    color: "#f43f5e",
  },
  {
    key: "workflowDepth",
    label: "Workflow Depth",
    description: "Multi-agent pipelines, plugins, and CI/CD connections.",
    icon: GitBranch,
    color: "#06b6d4",
  },
];

const TIERS = [
  { label: "Beginner", description: "Getting Started", color: "#6b7280", range: "0–2" },
  { label: "Intermediate", description: "Building Momentum", color: "#3b82f6", range: "2.1–4" },
  { label: "Advanced", description: "Power User", color: "#8b5cf6", range: "4.1–6" },
  { label: "Expert", description: "Ecosystem Architect", color: "#f59e0b", range: "6.1–8" },
  {
    label: "Master",
    description: "Full Autonomy",
    color: "#f59e0b",
    gradient: "linear-gradient(90deg, #f59e0b, #f43f5e)",
    range: "8.1–10",
  },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    icon: Terminal,
    title: "Run the CLI",
    description:
      "Run `npx agentscore export` in your terminal. It scans ~/.claude/ and builds a privacy-safe manifest of your setup in seconds.",
    accent: "#3b82f6",
  },
  {
    step: "02",
    icon: BarChart3,
    title: "Get Scored",
    description:
      "Your setup is scored across 6 dimensions — Automation, Memory, Agents, Tools, Skills, and Workflow Depth. No AI, fully deterministic.",
    accent: "#8b5cf6",
  },
  {
    step: "03",
    icon: Share2,
    title: "Share Your Profile",
    description:
      "Publish your public profile at agentscore.dev/u/you. Benchmark against the community. Discover how other developers build.",
    accent: "#10b981",
  },
];

async function getProfileStats(): Promise<{ count: number; avgScore: number }> {
  try {
    const { getDb } = await import("@/db");
    const { profiles } = await import("@/db/schema");
    const { eq, avg, count } = await import("drizzle-orm");
    const db = getDb();
    const rows = await db
      .select({ count: count(), avgScore: avg(profiles.totalScore) })
      .from(profiles)
      .where(eq(profiles.visibility, "public"));
    const row = rows[0];
    return {
      count: Number(row?.count ?? 0),
      avgScore: row?.avgScore ? Math.round(Number(row.avgScore) * 10) / 10 : 0,
    };
  } catch {
    return { count: 0, avgScore: 0 };
  }
}

const TIER_COLORS: Record<string, string> = {
  Master: "#f59e0b",
  Expert: "#f59e0b",
  Advanced: "#8b5cf6",
  Intermediate: "#3b82f6",
  Beginner: "#6b7280",
};

export default async function HomePage() {
  const stats = await getProfileStats();
  // Use mock profiles for the social proof section; show first 3
  const sampleProfiles = MOCK_PROFILES.slice(0, 3);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      {/* Hero */}
      <section className="relative flex flex-col items-center px-4 pt-20 pb-16 md:pt-28 md:pb-24 overflow-hidden">
        {/* Subtle background glow */}
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          aria-hidden="true"
          style={{
            background:
              "radial-gradient(ellipse 60% 40% at 50% -10%, #6366f140, transparent)",
          }}
        />

        <div className="relative z-10 max-w-3xl text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs text-indigo-300">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" aria-hidden="true" />
            Free · No install · Privacy-safe
          </div>

          <h1 className="text-4xl font-bold tracking-tight text-white md:text-5xl lg:text-6xl leading-tight">
            How optimized is your{" "}
            <span className="text-indigo-400">Claude Code</span> setup?
          </h1>
          <p className="mt-6 text-lg text-white/60 md:text-xl max-w-2xl mx-auto">
            Score your agent ecosystem across 6 dimensions. Get your tier, see your public
            profile, and benchmark against the community.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              size="lg"
              className="bg-indigo-500 hover:bg-indigo-600 text-white border-0 px-8 h-11 text-base font-semibold"
              render={<a href="#install" />}
            >
              Score Your Setup
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-white/20 text-white hover:bg-white/10 px-8 h-11 text-base"
              render={<Link href="/explore" />}
            >
              Explore Community
            </Button>
          </div>
        </div>

        {/* Hero layout — terminal animation + radar chart side by side on desktop */}
        <div className="relative z-10 mt-14 w-full max-w-5xl grid grid-cols-1 gap-6 md:grid-cols-2 items-start">
          {/* Terminal animation */}
          <div className="w-full">
            <TerminalAnimation />
          </div>

          {/* Radar chart preview */}
          <div className="flex flex-col items-center gap-4">
            <div className="rounded-2xl bg-[#12121a] border border-white/10 p-6 w-full flex flex-col items-center">
              <RadarChart dimensions={MOCK_PROFILES[0].dimensions} size="hero" />
              <p className="mt-4 text-sm text-white/50 text-center">
                <span className="font-mono text-white/70">@{MOCK_PROFILES[0].username}</span>
                {" · "}AgentScore{" "}
                <span className="font-bold text-white">{MOCK_PROFILES[0].composite}</span>
                {" · "}
                <span style={{ color: "var(--tier-master)" }}>
                  {MOCK_PROFILES[0].tierDescription}
                </span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="border-t border-white/10 bg-[#0d0d14] px-4 py-16 md:py-24">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-2xl font-semibold tracking-tight text-white md:text-3xl mb-4">
            How it works
          </h2>
          <p className="text-center text-sm text-white/50 mb-12">
            Three steps from zero to scored.
          </p>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {HOW_IT_WORKS.map(({ step, icon: Icon, title, description, accent }) => (
              <div
                key={step}
                className="relative rounded-xl bg-[#12121a] border border-white/10 p-6 flex flex-col gap-4 overflow-hidden"
              >
                {/* Step number watermark */}
                <span
                  className="absolute top-3 right-4 text-5xl font-black opacity-5 select-none"
                  aria-hidden="true"
                >
                  {step}
                </span>

                <div className="flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-lg shrink-0"
                    style={{ backgroundColor: `${accent}18` }}
                  >
                    <Icon size={20} style={{ color: accent }} aria-hidden="true" />
                  </div>
                  <span
                    className="text-xs font-bold uppercase tracking-widest"
                    style={{ color: accent }}
                  >
                    Step {step}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-white text-base">{title}</h3>
                  <p className="mt-2 text-sm text-white/55 leading-relaxed">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="px-4 py-16 md:py-24">
        <div className="mx-auto max-w-5xl">
          {/* Stats row */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-12">
            <div className="rounded-xl bg-[#12121a] border border-white/10 p-6 text-center">
              <div className="text-3xl font-bold text-white">
                {stats.count > 0 ? stats.count.toLocaleString() : MOCK_PROFILES.length}
              </div>
              <div className="mt-1 text-sm text-white/50">
                {stats.count > 0 ? "Engineers scored" : "Sample profiles"}
              </div>
            </div>
            <div className="rounded-xl bg-[#12121a] border border-white/10 p-6 text-center">
              <div className="text-3xl font-bold text-white">
                {stats.avgScore > 0 ? stats.avgScore : "6.5"}
              </div>
              <div className="mt-1 text-sm text-white/50">Average AgentScore</div>
            </div>
            <div className="rounded-xl bg-[#12121a] border border-white/10 p-6 text-center">
              <div className="text-3xl font-bold text-white">6</div>
              <div className="mt-1 text-sm text-white/50">Dimensions scored</div>
            </div>
          </div>

          <h2 className="text-center text-2xl font-semibold tracking-tight text-white md:text-3xl mb-4">
            Community profiles
          </h2>
          <p className="text-center text-sm text-white/50 mb-10">
            See how others have built their Claude Code ecosystems.
          </p>

          {/* Sample profile cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {sampleProfiles.map((profile) => {
              const tierColor = TIER_COLORS[profile.tier] ?? "#6b7280";
              return (
                <Link
                  key={profile.username}
                  href={`/u/${profile.username}`}
                  className="group block rounded-xl bg-[#12121a] border border-white/10 hover:border-indigo-500/50 p-5 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-8 w-8 rounded-full overflow-hidden shrink-0 bg-white/10">
                        <Image
                          src={profile.avatarUrl}
                          alt={profile.username}
                          width={32}
                          height={32}
                          className="h-full w-full object-cover"
                          unoptimized
                        />
                      </div>
                      <span className="font-mono text-sm font-semibold text-white truncate">
                        @{profile.username}
                      </span>
                    </div>
                    <div className="flex flex-col items-end shrink-0 gap-1">
                      <span
                        className="text-xl font-bold leading-none"
                        style={{ color: tierColor }}
                      >
                        {profile.composite}
                      </span>
                      <span
                        className="rounded px-1.5 py-0.5 text-xs font-medium"
                        style={{ backgroundColor: `${tierColor}18`, color: tierColor }}
                      >
                        {profile.tierDescription}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-3 items-start mb-4">
                    <RadarChart dimensions={profile.dimensions} size="thumbnail" />
                    <p className="text-xs text-white/55 leading-relaxed line-clamp-4 pt-0.5">
                      {profile.personality}
                    </p>
                  </div>

                  <div className="mt-3 text-xs text-indigo-400 group-hover:text-indigo-300 transition-colors">
                    View profile →
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="mt-8 text-center">
            <Button
              variant="outline"
              render={<Link href="/explore" />}
              className="border-white/20 text-white hover:bg-white/10"
            >
              Browse all profiles
            </Button>
          </div>
        </div>
      </section>

      {/* 6 Dimensions */}
      <section className="border-t border-white/10 bg-[#0d0d14] px-4 py-16 md:py-24">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-2xl font-semibold tracking-tight text-white md:text-3xl mb-12">
            6 dimensions scored
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {DIMENSIONS.map(({ key, label, description, icon: Icon, color }) => (
              <div
                key={key}
                className="rounded-xl bg-[#12121a] border border-white/10 p-5 flex gap-4 items-start"
                style={{ borderLeftColor: color, borderLeftWidth: 3 }}
              >
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                  style={{ backgroundColor: `${color}18` }}
                >
                  <Icon size={18} style={{ color }} aria-hidden="true" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-sm">{label}</h3>
                  <p className="mt-1 text-xs text-white/55 leading-relaxed">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Score Tiers */}
      <section className="px-4 py-16 md:py-24">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-2xl font-semibold tracking-tight text-white md:text-3xl mb-12">
            Score tiers
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-5">
            {TIERS.map(({ label, description, color, gradient, range }) => (
              <div
                key={label}
                className="rounded-xl bg-[#12121a] border border-white/10 p-4 flex flex-col gap-2 text-center sm:text-left"
              >
                <div
                  className="text-sm font-bold"
                  style={
                    gradient
                      ? {
                          background: gradient,
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor: "transparent",
                          backgroundClip: "text",
                        }
                      : { color }
                  }
                >
                  {label}
                </div>
                <div className="text-xs text-white/60">{description}</div>
                <div className="text-xs font-mono text-white/30">{range}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA — Installation */}
      <section
        id="install"
        className="border-t border-white/10 bg-[#0d0d14] px-4 py-16 md:py-24 text-center"
      >
        <div className="mx-auto max-w-xl">
          <h2 className="text-2xl font-semibold tracking-tight text-white md:text-3xl">
            Score your setup in 30 seconds
          </h2>
          <p className="mt-3 text-white/55 text-sm mb-8">
            Three commands. No global install required.
          </p>

          <div className="mx-auto max-w-md space-y-3 text-left">
            <div className="flex items-center gap-3 rounded-xl bg-[#111] border border-white/10 px-4 py-3">
              <span className="text-xs font-bold text-white/30 w-4">1</span>
              <code className="flex-1 font-mono text-sm text-emerald-400">
                npx agentscore export
              </code>
              <CopyButton text="npx agentscore export" />
            </div>
            <p className="text-xs text-white/40 pl-7">
              Scans ~/.claude/ and shows your score preview
            </p>

            <div className="flex items-center gap-3 rounded-xl bg-[#111] border border-white/10 px-4 py-3">
              <span className="text-xs font-bold text-white/30 w-4">2</span>
              <code className="flex-1 font-mono text-sm text-white/60">
                Review manifest → press <span className="text-emerald-400">y</span> to submit
              </code>
            </div>
            <p className="text-xs text-white/40 pl-7">
              Your profile goes live at agentscore.dev/u/you
            </p>

            <div className="flex items-center gap-3 rounded-xl bg-[#111] border border-white/10 px-4 py-3">
              <span className="text-xs font-bold text-white/30 w-4">3</span>
              <code className="flex-1 font-mono text-sm text-white/60">
                Share your profile link
              </code>
            </div>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              size="lg"
              className="bg-indigo-500 hover:bg-indigo-600 text-white border-0 px-8 h-11 font-semibold"
              render={<a href="#install" />}
            >
              Score Your Setup
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-white/20 text-white hover:bg-white/10 px-8 h-11"
              render={<Link href="/explore" />}
            >
              Explore Community
            </Button>
          </div>

          <p className="mt-6 text-xs text-white/30">
            Or{" "}
            <Link href="/upload" className="text-indigo-400 hover:underline">
              upload a manifest manually
            </Link>{" "}
            if you prefer.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 px-4 py-6 mt-auto">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-white/35">
          <span>
            AgentScore — Built by{" "}
            <a
              href="https://github.com/wkliwk"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white/70 transition-colors"
            >
              @wkliwk
            </a>
          </span>
          <div className="flex gap-4">
            <Link href="/explore" className="hover:text-white/60 transition-colors">
              Explore
            </Link>
            <Link href="/upload" className="hover:text-white/60 transition-colors">
              Upload
            </Link>
            <a
              href="https://github.com/wkliwk/agent-score"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white/60 transition-colors"
            >
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
