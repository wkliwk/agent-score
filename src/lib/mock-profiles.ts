import type { DimensionKey, TierLabel, TierDescription } from "@/lib/scoring/types";

export interface MockSignal {
  signal: string;
  met: boolean;
  earned?: number;
  max?: number;
}

export interface MockDimensionScore {
  dimension: DimensionKey;
  score: number;
  maxScore?: number;
  label: string;
  signals: MockSignal[];
}

export interface MockProfile {
  username: string;
  avatarUrl: string;
  composite: number;
  tier: TierLabel;
  tierDescription: TierDescription;
  personality: string;
  dimensions: MockDimensionScore[];
  agents: string[];
  mcpServers: string[];
  commands: string[];
  hooks: string[];
  strengths: { dimension: string; explanation: string }[];
  growthAreas: { dimension: string; suggestion: string }[];
  nextSteps: { action: string; dimension: string; pointsGain: number }[];
  bundle?: {
    fileCount: number;
    importCount: number;
    inspiredByCount: number;
  };
}

export const MOCK_PROFILES: MockProfile[] = [
  {
    username: "wkliwk",
    avatarUrl: "https://github.com/wkliwk.png",
    composite: 8.5,
    tier: "Master",
    tierDescription: "Full Autonomy",
    personality:
      "Automation-heavy, Memory-rich setup with deep agent coverage — and room to grow in Tool Integrations.",
    dimensions: [
      {
        dimension: "automation",
        score: 8,
        label: "Automation",
        signals: [
          { signal: "Has lifecycle hooks", met: true },
          { signal: "3+ hook events", met: true },
          { signal: "Status line configured", met: true },
          { signal: "Custom proxy / fallback", met: true },
          { signal: "Cron jobs", met: false },
        ],
      },
      {
        dimension: "memory",
        score: 10,
        label: "Memory",
        signals: [
          { signal: "MEMORY.md index", met: true },
          { signal: "11+ memory files", met: true },
          { signal: "4+ memory categories", met: true },
          { signal: "7+ project memory dirs", met: true },
        ],
      },
      {
        dimension: "agentCoverage",
        score: 10,
        label: "Agent Coverage",
        signals: [
          { signal: "10+ specialized agents", met: true },
          { signal: "Shared agent directory", met: true },
          { signal: "Role-based agents", met: true },
        ],
      },
      {
        dimension: "toolIntegrations",
        score: 4,
        label: "Tool Integrations",
        signals: [
          { signal: "2+ MCP servers", met: true },
          { signal: "5+ MCP servers", met: false },
          { signal: "GitHub MCP", met: false },
          { signal: "Playwright / browser MCP", met: false },
        ],
      },
      {
        dimension: "skillBreadth",
        score: 10,
        label: "Skill Breadth",
        signals: [
          { signal: "21+ custom commands", met: true },
          { signal: "Workflow commands", met: true },
          { signal: "Meta commands", met: true },
          { signal: "Domain-specific commands", met: true },
        ],
      },
      {
        dimension: "workflowDepth",
        score: 9,
        label: "Workflow Depth",
        signals: [
          { signal: "Multi-agent workflows", met: true },
          { signal: "Async channels", met: true },
          { signal: "Plugin system", met: true },
          { signal: "CI/CD integration", met: false },
        ],
      },
    ],
    agents: [
      "ceo",
      "pm",
      "frontend-dev",
      "backend-dev",
      "qa",
      "ops",
      "designer",
      "researcher",
      "data-analyst",
      "security",
    ],
    mcpServers: ["serena", "telegram"],
    commands: [
      "start-working",
      "daily",
      "dev-cycle",
      "status",
      "deploy",
      "review",
      "test",
      "research",
      "summarize",
      "plan",
      "retrospective",
      "standup",
      "hotfix",
      "release",
      "monitor",
      "audit",
      "refactor",
      "onboard",
      "off-ramp",
      "sync",
      "health-check",
    ],
    hooks: ["PreToolUse", "PostToolUse", "Stop", "SubagentStop"],
    bundle: {
      fileCount: 31,
      importCount: 47,
      inspiredByCount: 12,
    },
    strengths: [
      {
        dimension: "Memory",
        explanation:
          "Full memory index with 11 files across 4 categories. 7 project-specific memory directories.",
      },
      {
        dimension: "Agent Coverage",
        explanation:
          "10 specialized agents covering the full product lifecycle, with a shared directory.",
      },
      {
        dimension: "Skill Breadth",
        explanation:
          "21 custom commands including workflow, meta, and domain-specific commands.",
      },
    ],
    growthAreas: [
      {
        dimension: "Tool Integrations",
        suggestion:
          "Only 2 MCP servers detected. Add GitHub, Playwright, or a database MCP to unlock more automation surface.",
      },
    ],
    nextSteps: [
      { action: "Add a GitHub MCP server", dimension: "toolIntegrations", pointsGain: 1 },
      { action: "Add a Playwright MCP server", dimension: "toolIntegrations", pointsGain: 1 },
      { action: "Configure cron automation", dimension: "automation", pointsGain: 1 },
    ],
  },
  {
    username: "solodev99",
    avatarUrl: "https://github.com/ghost.png",
    composite: 4.5,
    tier: "Advanced",
    tierDescription: "Power User",
    personality:
      "A growing solo dev setup — solid memory foundations, but agents and automation are still nascent.",
    dimensions: [
      {
        dimension: "automation",
        score: 3,
        label: "Automation",
        signals: [
          { signal: "Has lifecycle hooks", met: true },
          { signal: "3+ hook events", met: false },
          { signal: "Status line configured", met: false },
          { signal: "Custom proxy / fallback", met: false },
          { signal: "Cron jobs", met: false },
        ],
      },
      {
        dimension: "memory",
        score: 6,
        label: "Memory",
        signals: [
          { signal: "MEMORY.md index", met: true },
          { signal: "11+ memory files", met: false },
          { signal: "4+ memory categories", met: true },
          { signal: "7+ project memory dirs", met: false },
        ],
      },
      {
        dimension: "agentCoverage",
        score: 4,
        label: "Agent Coverage",
        signals: [
          { signal: "3+ agents", met: true },
          { signal: "10+ specialized agents", met: false },
          { signal: "Shared agent directory", met: false },
        ],
      },
      {
        dimension: "toolIntegrations",
        score: 5,
        label: "Tool Integrations",
        signals: [
          { signal: "2+ MCP servers", met: true },
          { signal: "5+ MCP servers", met: true },
          { signal: "GitHub MCP", met: true },
          { signal: "Playwright / browser MCP", met: false },
        ],
      },
      {
        dimension: "skillBreadth",
        score: 4,
        label: "Skill Breadth",
        signals: [
          { signal: "5+ custom commands", met: true },
          { signal: "21+ custom commands", met: false },
          { signal: "Workflow commands", met: false },
          { signal: "Meta commands", met: false },
        ],
      },
      {
        dimension: "workflowDepth",
        score: 5,
        label: "Workflow Depth",
        signals: [
          { signal: "Multi-agent workflows", met: false },
          { signal: "Async channels", met: false },
          { signal: "Plugin system", met: true },
          { signal: "CI/CD integration", met: true },
        ],
      },
    ],
    agents: ["dev", "reviewer", "tester"],
    mcpServers: ["github", "filesystem", "postgres", "brave-search", "fetch"],
    commands: ["build", "test", "deploy", "review"],
    hooks: ["PreToolUse"],
    strengths: [
      { dimension: "Memory", explanation: "Structured memory with 4+ categories and MEMORY.md." },
      { dimension: "Tool Integrations", explanation: "5 MCP servers including GitHub and Postgres." },
    ],
    growthAreas: [
      {
        dimension: "Automation",
        suggestion: "Only 1 hook event. Add PostToolUse and a status line to increase automation score.",
      },
      {
        dimension: "Agent Coverage",
        suggestion: "Only 3 agents. Expand to cover design, ops, and QA roles.",
      },
    ],
    nextSteps: [
      { action: "Add PostToolUse hook", dimension: "automation", pointsGain: 2 },
      { action: "Create 5 more custom commands", dimension: "skillBreadth", pointsGain: 2 },
      { action: "Expand to 7+ agents", dimension: "agentCoverage", pointsGain: 3 },
    ],
  },
  {
    username: "teamlead_kai",
    avatarUrl: "https://github.com/ghost.png",
    composite: 6.5,
    tier: "Expert",
    tierDescription: "Ecosystem Architect",
    personality:
      "Memory-rich, agent-driven setup built for team coordination — hooks and workflows are the next frontier.",
    dimensions: [
      {
        dimension: "automation",
        score: 5,
        label: "Automation",
        signals: [
          { signal: "Has lifecycle hooks", met: true },
          { signal: "3+ hook events", met: true },
          { signal: "Status line configured", met: false },
          { signal: "Custom proxy / fallback", met: false },
          { signal: "Cron jobs", met: false },
        ],
      },
      {
        dimension: "memory",
        score: 9,
        label: "Memory",
        signals: [
          { signal: "MEMORY.md index", met: true },
          { signal: "11+ memory files", met: true },
          { signal: "4+ memory categories", met: true },
          { signal: "7+ project memory dirs", met: true },
        ],
      },
      {
        dimension: "agentCoverage",
        score: 8,
        label: "Agent Coverage",
        signals: [
          { signal: "10+ specialized agents", met: false },
          { signal: "7+ agents", met: true },
          { signal: "Shared agent directory", met: true },
          { signal: "Role-based agents", met: true },
        ],
      },
      {
        dimension: "toolIntegrations",
        score: 7,
        label: "Tool Integrations",
        signals: [
          { signal: "2+ MCP servers", met: true },
          { signal: "5+ MCP servers", met: true },
          { signal: "GitHub MCP", met: true },
          { signal: "Playwright / browser MCP", met: true },
        ],
      },
      {
        dimension: "skillBreadth",
        score: 6,
        label: "Skill Breadth",
        signals: [
          { signal: "10+ custom commands", met: true },
          { signal: "21+ custom commands", met: false },
          { signal: "Workflow commands", met: true },
          { signal: "Meta commands", met: false },
        ],
      },
      {
        dimension: "workflowDepth",
        score: 6,
        label: "Workflow Depth",
        signals: [
          { signal: "Multi-agent workflows", met: true },
          { signal: "Async channels", met: true },
          { signal: "Plugin system", met: false },
          { signal: "CI/CD integration", met: true },
        ],
      },
    ],
    agents: ["pm", "frontend", "backend", "qa", "devops", "data", "security"],
    mcpServers: ["github", "playwright", "filesystem", "postgres", "slack"],
    commands: [
      "standup", "sprint-plan", "review", "deploy", "monitor",
      "incident", "retrospective", "onboard", "test", "build",
    ],
    hooks: ["PreToolUse", "PostToolUse", "Stop"],
    strengths: [
      { dimension: "Memory", explanation: "11+ memory files with 4 categories and 7 project dirs." },
      { dimension: "Tool Integrations", explanation: "5 MCP servers including GitHub and Playwright." },
    ],
    growthAreas: [
      {
        dimension: "Automation",
        suggestion: "No status line or custom proxy detected. Add these to push automation score higher.",
      },
    ],
    nextSteps: [
      { action: "Configure a status line hook", dimension: "automation", pointsGain: 1 },
      { action: "Add 11 more custom commands", dimension: "skillBreadth", pointsGain: 2 },
      { action: "Expand to 10+ agents", dimension: "agentCoverage", pointsGain: 1 },
    ],
  },
  {
    username: "autobot_sam",
    avatarUrl: "https://github.com/ghost.png",
    composite: 7.0,
    tier: "Expert",
    tierDescription: "Ecosystem Architect",
    personality:
      "Automation-first setup with heavy hook coverage — memory and agent diversity are the gaps to close.",
    dimensions: [
      {
        dimension: "automation",
        score: 10,
        label: "Automation",
        signals: [
          { signal: "Has lifecycle hooks", met: true },
          { signal: "3+ hook events", met: true },
          { signal: "Status line configured", met: true },
          { signal: "Custom proxy / fallback", met: true },
          { signal: "Cron jobs", met: true },
        ],
      },
      {
        dimension: "memory",
        score: 4,
        label: "Memory",
        signals: [
          { signal: "MEMORY.md index", met: true },
          { signal: "11+ memory files", met: false },
          { signal: "4+ memory categories", met: false },
          { signal: "7+ project memory dirs", met: false },
        ],
      },
      {
        dimension: "agentCoverage",
        score: 5,
        label: "Agent Coverage",
        signals: [
          { signal: "3+ agents", met: true },
          { signal: "10+ specialized agents", met: false },
          { signal: "Shared agent directory", met: true },
        ],
      },
      {
        dimension: "toolIntegrations",
        score: 8,
        label: "Tool Integrations",
        signals: [
          { signal: "2+ MCP servers", met: true },
          { signal: "5+ MCP servers", met: true },
          { signal: "GitHub MCP", met: true },
          { signal: "Playwright / browser MCP", met: true },
        ],
      },
      {
        dimension: "skillBreadth",
        score: 7,
        label: "Skill Breadth",
        signals: [
          { signal: "10+ custom commands", met: true },
          { signal: "21+ custom commands", met: false },
          { signal: "Workflow commands", met: true },
          { signal: "Meta commands", met: true },
        ],
      },
      {
        dimension: "workflowDepth",
        score: 8,
        label: "Workflow Depth",
        signals: [
          { signal: "Multi-agent workflows", met: true },
          { signal: "Async channels", met: true },
          { signal: "Plugin system", met: true },
          { signal: "CI/CD integration", met: true },
        ],
      },
    ],
    agents: ["orchestrator", "worker-a", "worker-b", "monitor", "notifier"],
    mcpServers: ["github", "playwright", "filesystem", "cron-manager", "slack", "pagerduty"],
    commands: [
      "autorun", "schedule", "trigger", "monitor", "alert",
      "retry", "rollback", "status", "logs", "deploy",
      "test", "lint", "format", "build", "release",
    ],
    hooks: ["PreToolUse", "PostToolUse", "Stop", "SubagentStop", "PreCompact"],
    strengths: [
      { dimension: "Automation", explanation: "Full automation stack: hooks on all events, cron, status line, and custom proxy." },
      { dimension: "Workflow Depth", explanation: "Multi-agent with async channels, plugins, and CI/CD integration." },
    ],
    growthAreas: [
      {
        dimension: "Memory",
        suggestion: "Only a few memory files. Build out a MEMORY.md system with categories to score higher.",
      },
      {
        dimension: "Agent Coverage",
        suggestion: "5 agents, but mostly task-oriented. Add role-based agents (PM, QA, Designer) to broaden coverage.",
      },
    ],
    nextSteps: [
      { action: "Build a structured memory index with 4+ categories", dimension: "memory", pointsGain: 4 },
      { action: "Add 5 role-based agents", dimension: "agentCoverage", pointsGain: 3 },
      { action: "Expand to 21+ commands", dimension: "skillBreadth", pointsGain: 2 },
    ],
  },
  {
    username: "minimal_maya",
    avatarUrl: "https://github.com/ghost.png",
    composite: 1.5,
    tier: "Beginner",
    tierDescription: "Getting Started",
    personality:
      "A clean slate — just getting started with Claude Code. Every dimension has room to grow.",
    dimensions: [
      {
        dimension: "automation",
        score: 1,
        label: "Automation",
        signals: [
          { signal: "Has lifecycle hooks", met: false },
          { signal: "3+ hook events", met: false },
          { signal: "Status line configured", met: false },
          { signal: "Custom proxy / fallback", met: false },
          { signal: "Cron jobs", met: false },
        ],
      },
      {
        dimension: "memory",
        score: 3,
        label: "Memory",
        signals: [
          { signal: "MEMORY.md index", met: true },
          { signal: "11+ memory files", met: false },
          { signal: "4+ memory categories", met: false },
          { signal: "7+ project memory dirs", met: false },
        ],
      },
      {
        dimension: "agentCoverage",
        score: 1,
        label: "Agent Coverage",
        signals: [
          { signal: "Has any agents", met: true },
          { signal: "3+ agents", met: false },
          { signal: "Shared agent directory", met: false },
        ],
      },
      {
        dimension: "toolIntegrations",
        score: 2,
        label: "Tool Integrations",
        signals: [
          { signal: "1+ MCP servers", met: true },
          { signal: "2+ MCP servers", met: false },
          { signal: "GitHub MCP", met: false },
        ],
      },
      {
        dimension: "skillBreadth",
        score: 2,
        label: "Skill Breadth",
        signals: [
          { signal: "Has custom commands", met: true },
          { signal: "5+ custom commands", met: false },
          { signal: "Workflow commands", met: false },
        ],
      },
      {
        dimension: "workflowDepth",
        score: 1,
        label: "Workflow Depth",
        signals: [
          { signal: "Multi-agent workflows", met: false },
          { signal: "Async channels", met: false },
          { signal: "Plugin system", met: false },
          { signal: "CI/CD integration", met: false },
        ],
      },
    ],
    agents: ["assistant"],
    mcpServers: ["filesystem"],
    commands: ["help", "status"],
    hooks: [],
    strengths: [
      { dimension: "Memory", explanation: "MEMORY.md is in place — a strong foundation." },
    ],
    growthAreas: [
      { dimension: "Automation", suggestion: "No hooks detected. Start by adding a PreToolUse hook." },
      { dimension: "Agent Coverage", suggestion: "Only 1 agent. Add a reviewer and a tester to get started." },
      { dimension: "Workflow Depth", suggestion: "No workflows or plugins yet. Try a simple multi-agent workflow." },
    ],
    nextSteps: [
      { action: "Add a PreToolUse hook", dimension: "automation", pointsGain: 3 },
      { action: "Create 5+ custom commands", dimension: "skillBreadth", pointsGain: 3 },
      { action: "Add 2 more MCP servers (GitHub, Playwright)", dimension: "toolIntegrations", pointsGain: 2 },
    ],
  },
];

export function getMockProfile(username: string): MockProfile | null {
  return MOCK_PROFILES.find((p) => p.username === username) ?? null;
}
