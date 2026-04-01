import Link from "next/link";
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
    step: "1",
    icon: Terminal,
    title: "Export",
    description:
      "Run the CLI to generate a privacy-safe manifest of your Claude Code setup.",
  },
  {
    step: "2",
    icon: BarChart3,
    title: "Score",
    description:
      "Get scored across 6 dimensions with actionable insights on what to improve.",
  },
  {
    step: "3",
    icon: Share2,
    title: "Share",
    description:
      "Share your profile and discover how other developers build their ecosystems.",
  },
];

const heroProfile = MOCK_PROFILES[0];

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      {/* Hero */}
      <section className="flex flex-col items-center px-4 pt-20 pb-16 md:pt-28 md:pb-24 text-center">
        <div className="max-w-3xl">
          <h1 className="text-4xl font-bold tracking-tight text-white md:text-5xl lg:text-6xl leading-tight">
            How optimized is your{" "}
            <span className="text-indigo-400">Claude Code</span> setup?
          </h1>
          <p className="mt-6 text-lg text-white/60 md:text-xl max-w-2xl mx-auto">
            Score your agent ecosystem across 6 dimensions. Share your profile.
            Discover how others build.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              size="lg"
              className="bg-indigo-500 hover:bg-indigo-600 text-white border-0 px-6 h-11"
              render={<Link href="/upload" />}
            >
              Get Your Score
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-white/20 text-white hover:bg-white/10 px-6 h-11"
              render={<Link href="/explore" />}
            >
              Explore Profiles
            </Button>
          </div>

          {/* CLI block */}
          <div className="mt-8 mx-auto max-w-sm">
            <div className="flex items-center justify-between rounded-xl bg-[#111] border border-white/10 px-4 py-3">
              <code className="font-mono text-sm text-emerald-400">
                npx agentscore export
              </code>
              <CopyButton text="npx agentscore export" />
            </div>
          </div>
        </div>

        {/* Hero radar chart */}
        <div className="mt-14 flex flex-col items-center gap-4">
          <div className="rounded-2xl bg-[#12121a] border border-white/10 p-6">
            <RadarChart dimensions={heroProfile.dimensions} size="hero" />
          </div>
          <p className="text-sm text-white/50">
            <span className="font-mono text-white/70">@{heroProfile.username}</span>
            {" · "}AgentScore{" "}
            <span className="font-bold text-white">{heroProfile.composite}</span>
            {" · "}
            <span style={{ color: "var(--tier-master)" }}>{heroProfile.tierDescription}</span>
          </p>
        </div>
      </section>

      {/* How It Works */}
      <section className="border-t border-white/10 bg-[#0d0d14] px-4 py-16 md:py-24">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-2xl font-semibold tracking-tight text-white md:text-3xl mb-12">
            How it works
          </h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {HOW_IT_WORKS.map(({ step, icon: Icon, title, description }) => (
              <div
                key={step}
                className="rounded-xl bg-[#12121a] border border-white/10 p-6 flex flex-col gap-4"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/15 text-indigo-400">
                    <Icon size={18} />
                  </div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-white/40">
                    Step {step}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-white">{title}</h3>
                  <p className="mt-1 text-sm text-white/55 leading-relaxed">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6 Dimensions */}
      <section className="px-4 py-16 md:py-24">
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
                  <Icon size={18} style={{ color }} />
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
      <section className="border-t border-white/10 bg-[#0d0d14] px-4 py-16 md:py-24">
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

      {/* CTA — 30-second setup guide */}
      <section className="px-4 py-16 md:py-24 text-center">
        <div className="mx-auto max-w-xl">
          <h2 className="text-2xl font-semibold tracking-tight text-white md:text-3xl">
            Score your setup in 30 seconds
          </h2>
          <p className="mt-3 text-white/55 text-sm mb-8">
            Three commands. That&apos;s it.
          </p>

          <div className="mx-auto max-w-md space-y-3 text-left">
            <div className="flex items-center gap-3 rounded-xl bg-[#111] border border-white/10 px-4 py-3">
              <span className="text-xs font-bold text-white/30 w-4">1</span>
              <code className="flex-1 font-mono text-sm text-emerald-400">npx agentscore export</code>
              <CopyButton text="npx agentscore export" />
            </div>
            <p className="text-xs text-white/40 pl-7">Scans ~/.claude/ and shows your score preview</p>

            <div className="flex items-center gap-3 rounded-xl bg-[#111] border border-white/10 px-4 py-3">
              <span className="text-xs font-bold text-white/30 w-4">2</span>
              <code className="flex-1 font-mono text-sm text-white/60">Review manifest → press <span className="text-emerald-400">y</span> to submit</code>
            </div>
            <p className="text-xs text-white/40 pl-7">Your profile goes live at agentscore.dev/u/you</p>

            <div className="flex items-center gap-3 rounded-xl bg-[#111] border border-white/10 px-4 py-3">
              <span className="text-xs font-bold text-white/30 w-4">3</span>
              <code className="flex-1 font-mono text-sm text-white/60">Share your profile link</code>
            </div>
          </div>

          <p className="mt-6 text-xs text-white/30">
            Or{" "}
            <Link href="/upload" className="text-indigo-400 hover:underline">
              upload a manifest manually
            </Link>
            {" "}if you prefer.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 px-4 py-6 mt-auto">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-white/35">
          <span>AgentScore — Built by{" "}
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
            <Link href="/explore" className="hover:text-white/60 transition-colors">Explore</Link>
            <Link href="/upload" className="hover:text-white/60 transition-colors">Upload</Link>
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
