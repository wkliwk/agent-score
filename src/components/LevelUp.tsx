"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, ArrowUpRight, Zap } from "lucide-react";
import type { MockProfile, MockDimensionScore } from "@/lib/mock-profiles";

const DIM_COLORS: Record<string, string> = {
  automation: "#3b82f6",
  memory: "#10b981",
  agentCoverage: "#8b5cf6",
  toolIntegrations: "#f59e0b",
  skillBreadth: "#f43f5e",
  workflowDepth: "#06b6d4",
};

interface Instruction {
  action: string;
  detail: string;
  docUrl: string;
  points: number;
}

const SIGNAL_INSTRUCTIONS: Record<string, Instruction> = {
  // Automation
  "Has lifecycle hooks": {
    action: "Add lifecycle hooks to settings.json",
    detail: "Create a hooks section in ~/.claude/settings.json with at least one event handler (e.g. PreToolUse).",
    docUrl: "https://docs.anthropic.com/en/docs/claude-code/hooks",
    points: 2,
  },
  "Has hooks configured": {
    action: "Add lifecycle hooks to settings.json",
    detail: "Create a hooks section in ~/.claude/settings.json with at least one event handler.",
    docUrl: "https://docs.anthropic.com/en/docs/claude-code/hooks",
    points: 2,
  },
  "Has UserPromptSubmit hook": {
    action: "Add a UserPromptSubmit hook",
    detail: "Add a hook for the UserPromptSubmit event to validate or transform prompts before they're sent.",
    docUrl: "https://docs.anthropic.com/en/docs/claude-code/hooks",
    points: 1,
  },
  "Has PreToolUse hook": {
    action: "Add a PreToolUse hook",
    detail: "Add a hook for the PreToolUse event to gate or log tool usage.",
    docUrl: "https://docs.anthropic.com/en/docs/claude-code/hooks",
    points: 1,
  },
  "Has Stop hook": {
    action: "Add a Stop hook",
    detail: "Add a Stop hook to run cleanup or notifications when Claude finishes a task.",
    docUrl: "https://docs.anthropic.com/en/docs/claude-code/hooks",
    points: 1,
  },
  "3+ hook events": {
    action: "Configure 3+ hook events",
    detail: "Add hooks for at least 3 different events (PreToolUse, PostToolUse, Stop, etc.).",
    docUrl: "https://docs.anthropic.com/en/docs/claude-code/hooks",
    points: 1,
  },
  "Total hook count >= 3": {
    action: "Configure 3+ total hooks",
    detail: "Add hooks across different events to reach at least 3 total hook definitions.",
    docUrl: "https://docs.anthropic.com/en/docs/claude-code/hooks",
    points: 1,
  },
  "Total hook count >= 6": {
    action: "Expand to 6+ total hooks",
    detail: "Add more hooks across different events for deeper automation coverage.",
    docUrl: "https://docs.anthropic.com/en/docs/claude-code/hooks",
    points: 1,
  },
  "Status line configured": {
    action: "Configure a status line",
    detail: "Add a statusLine hook to display real-time info (git branch, token usage, etc.) in the Claude Code UI.",
    docUrl: "https://docs.anthropic.com/en/docs/claude-code/hooks",
    points: 1,
  },
  "Has status line configured": {
    action: "Configure a status line",
    detail: "Add a statusLine hook to display real-time info in the Claude Code UI.",
    docUrl: "https://docs.anthropic.com/en/docs/claude-code/hooks",
    points: 1,
  },
  "Cron jobs": {
    action: "Set up cron automation",
    detail: "Use Claude Code's cron/schedule feature to run recurring tasks (daily reports, health checks).",
    docUrl: "https://docs.anthropic.com/en/docs/claude-code/cli-usage",
    points: 1,
  },
  "Has cron jobs": {
    action: "Set up cron automation",
    detail: "Use Claude Code's cron/schedule feature to run recurring tasks.",
    docUrl: "https://docs.anthropic.com/en/docs/claude-code/cli-usage",
    points: 1,
  },
  "Custom proxy / fallback": {
    action: "Configure a custom proxy or fallback",
    detail: "Set up a custom API proxy or model fallback chain for resilience.",
    docUrl: "https://docs.anthropic.com/en/docs/claude-code/settings",
    points: 1,
  },
  "Has custom proxy or fallback": {
    action: "Configure a custom proxy or fallback",
    detail: "Set up a custom API proxy or model fallback chain.",
    docUrl: "https://docs.anthropic.com/en/docs/claude-code/settings",
    points: 1,
  },

  // Memory
  "MEMORY.md index": {
    action: "Create a MEMORY.md index file",
    detail: "Create ~/.claude/projects/<project>/memory/MEMORY.md to organize persistent knowledge.",
    docUrl: "https://docs.anthropic.com/en/docs/claude-code/memory",
    points: 2,
  },
  "Has MEMORY.md index file": {
    action: "Create a MEMORY.md index file",
    detail: "Create MEMORY.md in your project memory directory to organize persistent knowledge.",
    docUrl: "https://docs.anthropic.com/en/docs/claude-code/memory",
    points: 2,
  },
  "11+ memory files": {
    action: "Build 11+ memory files",
    detail: "Add memory files for user preferences, project context, feedback, and references.",
    docUrl: "https://docs.anthropic.com/en/docs/claude-code/memory",
    points: 1,
  },
  "Memory file count >= 3": {
    action: "Create 3+ memory files",
    detail: "Add memory files covering different aspects of your projects and preferences.",
    docUrl: "https://docs.anthropic.com/en/docs/claude-code/memory",
    points: 1,
  },
  "Memory file count >= 6": {
    action: "Expand to 6+ memory files",
    detail: "Add more memory files to cover feedback, references, and project context.",
    docUrl: "https://docs.anthropic.com/en/docs/claude-code/memory",
    points: 1,
  },
  "Memory file count >= 10": {
    action: "Build to 10+ memory files",
    detail: "Comprehensive memory coverage across user, feedback, project, and reference types.",
    docUrl: "https://docs.anthropic.com/en/docs/claude-code/memory",
    points: 1,
  },
  "4+ memory categories": {
    action: "Use 4+ memory categories",
    detail: "Organize memories into user, feedback, project, and reference categories.",
    docUrl: "https://docs.anthropic.com/en/docs/claude-code/memory",
    points: 1,
  },
  "Has >= 2 memory categories": {
    action: "Use 2+ memory categories",
    detail: "Organize memory files by type (user, feedback, project, reference).",
    docUrl: "https://docs.anthropic.com/en/docs/claude-code/memory",
    points: 1,
  },
  "Has >= 4 memory categories": {
    action: "Use all 4 memory categories",
    detail: "Have memory files in user, feedback, project, and reference categories.",
    docUrl: "https://docs.anthropic.com/en/docs/claude-code/memory",
    points: 1,
  },
  "7+ project memory dirs": {
    action: "Set up 7+ project-specific memory directories",
    detail: "Create memory directories for each of your active projects under ~/.claude/projects/.",
    docUrl: "https://docs.anthropic.com/en/docs/claude-code/memory",
    points: 1,
  },

  // Agent Coverage
  "Has any agents": {
    action: "Create your first custom agent",
    detail: "Add a .md file to ~/.claude/agents/ defining a specialized agent role.",
    docUrl: "https://docs.anthropic.com/en/docs/claude-code/sub-agents",
    points: 2,
  },
  "Has custom agents": {
    action: "Create custom agents",
    detail: "Add .md files to ~/.claude/agents/ defining specialized agent roles.",
    docUrl: "https://docs.anthropic.com/en/docs/claude-code/sub-agents",
    points: 2,
  },
  "3+ agents": {
    action: "Expand to 3+ agents",
    detail: "Add agents for dev, QA, and ops roles to cover your core workflow.",
    docUrl: "https://docs.anthropic.com/en/docs/claude-code/sub-agents",
    points: 1,
  },
  "Agent count >= 3": {
    action: "Expand to 3+ agents",
    detail: "Add agents for dev, QA, and ops roles to cover your core workflow.",
    docUrl: "https://docs.anthropic.com/en/docs/claude-code/sub-agents",
    points: 1,
  },
  "10+ specialized agents": {
    action: "Build 10+ specialized agents",
    detail: "Cover the full product lifecycle: PM, frontend, backend, QA, ops, designer, researcher, etc.",
    docUrl: "https://docs.anthropic.com/en/docs/claude-code/sub-agents",
    points: 1,
  },
  "Agent count >= 10": {
    action: "Build to 10+ agents",
    detail: "Cover the full product lifecycle: PM, frontend, backend, QA, ops, designer, etc.",
    docUrl: "https://docs.anthropic.com/en/docs/claude-code/sub-agents",
    points: 1,
  },
  "Shared agent directory": {
    action: "Create a shared agent directory",
    detail: "Add an agents/shared/ directory with agent definitions reusable across projects.",
    docUrl: "https://docs.anthropic.com/en/docs/claude-code/sub-agents",
    points: 1,
  },
  "Has shared agent directory": {
    action: "Create a shared agent directory",
    detail: "Add an agents/shared/ directory with reusable agent definitions.",
    docUrl: "https://docs.anthropic.com/en/docs/claude-code/sub-agents",
    points: 1,
  },
  "Role-based agents": {
    action: "Use role-based agent names",
    detail: "Name agents by role (dev, qa, pm, ops, designer) for clear responsibility mapping.",
    docUrl: "https://docs.anthropic.com/en/docs/claude-code/sub-agents",
    points: 1,
  },
  "Has agents with role-based names": {
    action: "Use role-based agent names",
    detail: "Name agents by role (dev, qa, pm, ops, designer) for clear responsibility.",
    docUrl: "https://docs.anthropic.com/en/docs/claude-code/sub-agents",
    points: 1,
  },

  // Tool Integrations
  "1+ MCP servers": {
    action: "Connect your first MCP server",
    detail: "Add an MCP server to ~/.claude/mcp.json (e.g. filesystem, GitHub).",
    docUrl: "https://docs.anthropic.com/en/docs/claude-code/mcp-servers",
    points: 2,
  },
  "2+ MCP servers": {
    action: "Connect 2+ MCP servers",
    detail: "Add a second MCP server for a different tool category (code, design, communication).",
    docUrl: "https://docs.anthropic.com/en/docs/claude-code/mcp-servers",
    points: 1,
  },
  "5+ MCP servers": {
    action: "Connect 5+ MCP servers",
    detail: "Build a diverse tool ecosystem covering code, design, communication, and browser tools.",
    docUrl: "https://docs.anthropic.com/en/docs/claude-code/mcp-servers",
    points: 1,
  },
  "GitHub MCP": {
    action: "Add a GitHub MCP server",
    detail: "Connect GitHub MCP to manage repos, issues, and PRs directly from Claude Code.",
    docUrl: "https://docs.anthropic.com/en/docs/claude-code/mcp-servers",
    points: 1,
  },
  "Playwright / browser MCP": {
    action: "Add a Playwright or browser MCP server",
    detail: "Connect Playwright MCP for browser automation, testing, and screenshots.",
    docUrl: "https://docs.anthropic.com/en/docs/claude-code/mcp-servers",
    points: 1,
  },

  // Skill Breadth
  "Has custom commands": {
    action: "Create custom slash commands",
    detail: "Add .md files to ~/.claude/commands/ to define reusable workflows.",
    docUrl: "https://docs.anthropic.com/en/docs/claude-code/slash-commands",
    points: 2,
  },
  "5+ custom commands": {
    action: "Create 5+ custom commands",
    detail: "Add commands for your common workflows: build, test, deploy, review, status.",
    docUrl: "https://docs.anthropic.com/en/docs/claude-code/slash-commands",
    points: 1,
  },
  "10+ custom commands": {
    action: "Expand to 10+ custom commands",
    detail: "Cover more workflows: standup, sprint-plan, incident, onboard, monitor, etc.",
    docUrl: "https://docs.anthropic.com/en/docs/claude-code/slash-commands",
    points: 1,
  },
  "21+ custom commands": {
    action: "Build 21+ custom commands",
    detail: "Create a comprehensive command library covering all aspects of your workflow.",
    docUrl: "https://docs.anthropic.com/en/docs/claude-code/slash-commands",
    points: 1,
  },
  "Workflow commands": {
    action: "Add workflow commands (deploy, build, review, test)",
    detail: "Create commands for your core dev workflows so Claude can execute them by name.",
    docUrl: "https://docs.anthropic.com/en/docs/claude-code/slash-commands",
    points: 1,
  },
  "Meta commands": {
    action: "Add meta commands (status, daily, start)",
    detail: "Create commands for managing and monitoring your workflow itself.",
    docUrl: "https://docs.anthropic.com/en/docs/claude-code/slash-commands",
    points: 1,
  },
  "Domain-specific commands": {
    action: "Add domain-specific commands",
    detail: "Create commands tailored to your specific domain (e.g. data-pipeline, audit, compliance).",
    docUrl: "https://docs.anthropic.com/en/docs/claude-code/slash-commands",
    points: 1,
  },

  // Workflow Depth
  "Multi-agent workflows": {
    action: "Set up multi-agent workflows",
    detail: "Configure agents that can spawn and coordinate with other agents using the Agent tool.",
    docUrl: "https://docs.anthropic.com/en/docs/claude-code/sub-agents",
    points: 1,
  },
  "Async channels": {
    action: "Configure async communication channels",
    detail: "Set up Telegram, Slack, or other channel plugins for async agent notifications.",
    docUrl: "https://docs.anthropic.com/en/docs/claude-code/mcp-servers",
    points: 1,
  },
  "Plugin system": {
    action: "Enable plugins",
    detail: "Add plugins to extend Claude Code's capabilities (e.g. telegram, notifications).",
    docUrl: "https://docs.anthropic.com/en/docs/claude-code/settings",
    points: 1,
  },
  "Has plugins enabled": {
    action: "Enable plugins",
    detail: "Add plugins to your settings to extend Claude Code's capabilities.",
    docUrl: "https://docs.anthropic.com/en/docs/claude-code/settings",
    points: 1,
  },
  "CI/CD integration": {
    action: "Integrate with CI/CD",
    detail: "Use Claude Code in your CI/CD pipeline for automated reviews, testing, or deployment.",
    docUrl: "https://docs.anthropic.com/en/docs/claude-code/cli-usage",
    points: 1,
  },
};

function getInstruction(signalName: string): Instruction {
  return (
    SIGNAL_INSTRUCTIONS[signalName] ?? {
      action: signalName,
      detail: `Complete this signal to improve your score.`,
      docUrl: "https://docs.anthropic.com/en/docs/claude-code/overview",
      points: 1,
    }
  );
}

function getTierForScore(composite: number): string {
  if (composite <= 2.0) return "Beginner";
  if (composite <= 4.0) return "Intermediate";
  if (composite <= 6.0) return "Advanced";
  if (composite <= 8.0) return "Expert";
  return "Master";
}

export default function LevelUp({ profile }: { profile: MockProfile }) {
  const [expandedDim, setExpandedDim] = useState<string | null>(null);

  const improvableDims = profile.dimensions.filter((d) => d.score < 8);

  if (improvableDims.length === 0) {
    return null;
  }

  // Collect all unmet signals across all dimensions, sorted by points desc
  const allUnmet: { dim: MockDimensionScore; signal: string; instruction: Instruction }[] = [];
  for (const dim of improvableDims) {
    for (const sig of dim.signals) {
      if (!sig.met) {
        allUnmet.push({ dim, signal: sig.signal, instruction: getInstruction(sig.signal) });
      }
    }
  }
  allUnmet.sort((a, b) => b.instruction.points - a.instruction.points);

  // Calculate projected score from top 3 improvements
  const top3 = allUnmet.slice(0, 3);
  const pointGainByDim = new Map<string, number>();
  for (const item of top3) {
    const key = item.dim.dimension;
    pointGainByDim.set(key, (pointGainByDim.get(key) ?? 0) + item.instruction.points);
  }

  const projectedDimScores = profile.dimensions.map((d) => {
    const gain = pointGainByDim.get(d.dimension) ?? 0;
    return Math.min(d.score + gain, 10);
  });
  const projectedComposite =
    Math.round((projectedDimScores.reduce((s, v) => s + v, 0) / 6) * 10) / 10;
  const projectedTier = getTierForScore(projectedComposite);

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-white">Level Up</h2>

      {/* Projected score card */}
      <div className="rounded-xl bg-[#12121a] border border-indigo-500/20 p-5">
        <h3 className="text-xs uppercase tracking-widest text-indigo-400 mb-3">
          Your Path to {projectedTier}
        </h3>
        <p className="text-sm text-white/60 mb-3">
          Complete these top 3 improvements to reach{" "}
          <span className="text-white font-semibold">{projectedComposite}</span>{" "}
          ({projectedTier}):
        </p>
        <div className="space-y-2">
          {top3.map((item, i) => (
            <div
              key={`${item.dim.dimension}-${item.signal}`}
              className="flex items-center gap-3 rounded-lg bg-white/5 px-4 py-2.5"
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-xs font-bold text-indigo-400">
                {i + 1}
              </span>
              <span className="flex-1 text-sm text-white/70">{item.instruction.action}</span>
              <span
                className="shrink-0 rounded px-1.5 py-0.5 text-xs font-mono"
                style={{
                  backgroundColor: `${DIM_COLORS[item.dim.dimension]}15`,
                  color: DIM_COLORS[item.dim.dimension],
                }}
              >
                +{item.instruction.points}pt
              </span>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-2 text-xs text-white/30">
          <Zap size={12} className="text-indigo-400" />
          <span>
            {profile.composite} → {projectedComposite} ({profile.tier} → {projectedTier})
          </span>
        </div>
      </div>

      {/* Per-dimension improvement lists */}
      {improvableDims.map((dim) => {
        const color = DIM_COLORS[dim.dimension] ?? "#6b7280";
        const unmetSignals = dim.signals.filter((s) => !s.met);
        const isExpanded = expandedDim === dim.dimension;

        if (unmetSignals.length === 0) return null;

        return (
          <div
            key={dim.dimension}
            className="rounded-xl bg-[#12121a] border border-white/10 overflow-hidden"
            style={{ borderTopColor: color, borderTopWidth: 2 }}
          >
            <button
              onClick={() => setExpandedDim(isExpanded ? null : dim.dimension)}
              className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-3">
                <h3 className="font-semibold text-white text-sm">{dim.label}</h3>
                <span className="text-xs font-mono text-white/30">
                  {dim.score}/10 — {unmetSignals.length} improvement{unmetSignals.length > 1 ? "s" : ""}
                </span>
              </div>
              {isExpanded ? (
                <ChevronUp size={16} className="text-white/40" />
              ) : (
                <ChevronDown size={16} className="text-white/40" />
              )}
            </button>

            {isExpanded && (
              <div className="px-5 pb-5 space-y-3">
                {unmetSignals.map((sig) => {
                  const instruction = getInstruction(sig.signal);
                  return (
                    <div
                      key={sig.signal}
                      className="rounded-lg bg-white/5 p-4"
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <span className="text-sm font-medium text-white">
                          {instruction.action}
                        </span>
                        <span
                          className="shrink-0 rounded px-1.5 py-0.5 text-xs font-mono"
                          style={{ backgroundColor: `${color}15`, color }}
                        >
                          +{instruction.points}pt
                        </span>
                      </div>
                      <p className="text-xs text-white/50 mb-2">{instruction.detail}</p>
                      <a
                        href={instruction.docUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs hover:underline transition-colors"
                        style={{ color }}
                      >
                        View docs
                        <ArrowUpRight size={11} />
                      </a>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
