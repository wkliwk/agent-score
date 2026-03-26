import type {
  AgentScoreManifest,
  DimensionScore,
  ScoreResult,
  SignalResult,
  Tier,
} from "./types";

// ---------------------------------------------------------------------------
// Role keyword registry for D3: Agent Coverage
// ---------------------------------------------------------------------------
const ROLE_KEYWORDS = [
  "dev",
  "frontend",
  "backend",
  "qa",
  "test",
  "ops",
  "deploy",
  "pm",
  "product",
  "design",
  "finance",
  "research",
  "ceo",
  "manager",
] as const;

// ---------------------------------------------------------------------------
// MCP tool category registries for D4: Tool Integrations
// ---------------------------------------------------------------------------
const MCP_CODE_TOOLS = ["github", "gitlab", "bitbucket", "jira", "linear"];
const MCP_DESIGN_TOOLS = ["figma", "tldraw", "canva"];
const MCP_COMMUNICATION_TOOLS = [
  "telegram",
  "slack",
  "discord",
  "email",
  "gmail",
];
const MCP_BROWSER_TOOLS = [
  "playwright",
  "puppeteer",
  "selenium",
  "browserbase",
];

// ---------------------------------------------------------------------------
// Command keyword registries for D5: Skill Breadth
// ---------------------------------------------------------------------------
const WORKFLOW_KEYWORDS = ["deploy", "build", "review", "test", "cycle"];
const META_KEYWORDS = ["status", "daily", "start", "switch"];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function signal(label: string, met: boolean, points: number): SignalResult {
  return {
    signal: label,
    earned: met ? points : 0,
    max: points,
    met,
  };
}

function cap(value: number, max: number): number {
  return Math.min(value, max);
}

function serverNamesMatch(names: string[], keywords: string[]): boolean {
  return names.some((name) =>
    keywords.some((kw) => name.toLowerCase().includes(kw))
  );
}

function commandNamesMatch(names: string[], keywords: string[]): boolean {
  return names.some((name) =>
    keywords.some((kw) => name.toLowerCase().includes(kw))
  );
}

// ---------------------------------------------------------------------------
// D1: Automation (0–10)
// ---------------------------------------------------------------------------
function scoreAutomation(manifest: AgentScoreManifest): DimensionScore {
  const { hooks, workflows } = manifest;
  const hasAnyHooks = hooks.totalHookCount > 0;
  const hasUserPromptSubmit = hooks.events.includes("UserPromptSubmit");
  const hasPreToolUse = hooks.events.includes("PreToolUse");
  const hasStop = hooks.events.includes("Stop");
  const hookCountGe3 = hooks.totalHookCount >= 3;
  const hookCountGe6 = hooks.totalHookCount >= 6;
  const hasStatusLine = hooks.hasStatusLine;
  const hasCron = workflows.hasCronJobs;
  const hasProxy = workflows.hasCustomProxy;

  const signals: SignalResult[] = [
    signal("Has hooks configured", hasAnyHooks, 2),
    signal("Has UserPromptSubmit hook", hasUserPromptSubmit, 1),
    signal("Has PreToolUse hook", hasPreToolUse, 1),
    signal("Has Stop hook", hasStop, 1),
    signal("Total hook count >= 3", hookCountGe3, 1),
    signal("Total hook count >= 6", hookCountGe6, 1),
    signal("Has status line configured", hasStatusLine, 1),
    signal("Has cron jobs", hasCron, 1),
    signal("Has custom proxy or fallback", hasProxy, 1),
  ];

  const raw = signals.reduce((sum, s) => sum + s.earned, 0);

  return {
    dimension: "automation",
    label: "Automation",
    score: cap(raw, 10),
    maxScore: 10,
    signals,
  };
}

// ---------------------------------------------------------------------------
// D2: Memory (0–10)
// ---------------------------------------------------------------------------
function scoreMemory(manifest: AgentScoreManifest): DimensionScore {
  const { memory } = manifest;
  const hasMemoryMd = memory.hasMemoryMd;
  const fileCountGe3 = memory.memoryFileCount >= 3;
  const fileCountGe6 = memory.memoryFileCount >= 6;
  const fileCountGe10 = memory.memoryFileCount >= 10;
  const categoriesGe2 = memory.memoryCategories.length >= 2;
  const categoriesGe4 = memory.memoryCategories.length >= 4;
  const projectDirsGe1 = memory.projectMemoryDirs >= 1;
  const projectDirsGe3 = memory.projectMemoryDirs >= 3;
  const projectDirsGe5 = memory.projectMemoryDirs >= 5;

  const signals: SignalResult[] = [
    signal("Has MEMORY.md index file", hasMemoryMd, 2),
    signal("Memory file count >= 3", fileCountGe3, 1),
    signal("Memory file count >= 6", fileCountGe6, 1),
    signal("Memory file count >= 10", fileCountGe10, 1),
    signal("Has >= 2 memory categories", categoriesGe2, 1),
    signal("Has >= 4 memory categories", categoriesGe4, 1),
    signal("Has project-specific memory dirs >= 1", projectDirsGe1, 1),
    signal("Has project-specific memory dirs >= 3", projectDirsGe3, 1),
    signal("Has project-specific memory dirs >= 5", projectDirsGe5, 1),
  ];

  const raw = signals.reduce((sum, s) => sum + s.earned, 0);

  return {
    dimension: "memory",
    label: "Memory",
    score: cap(raw, 10),
    maxScore: 10,
    signals,
  };
}

// ---------------------------------------------------------------------------
// D3: Agent Coverage (0–10)
// ---------------------------------------------------------------------------
function scoreAgentCoverage(manifest: AgentScoreManifest): DimensionScore {
  const { agents } = manifest;
  const hasAnyAgents = agents.count > 0;
  const agentCountGe3 = agents.count >= 3;
  const agentCountGe5 = agents.count >= 5;
  const agentCountGe8 = agents.count >= 8;
  const agentCountGe10 = agents.count >= 10;
  const hasSharedDir = agents.hasSharedDir;

  // Role-based names: at least one agent name contains a role keyword
  const namesLower = agents.names.map((n) => n.toLowerCase());
  const hasRoleBasedNames = ROLE_KEYWORDS.some((kw) =>
    namesLower.some((name) => name.includes(kw))
  );

  // Distinct role categories matched
  const matchedCategories = new Set<string>();
  for (const name of namesLower) {
    for (const kw of ROLE_KEYWORDS) {
      if (name.includes(kw)) {
        matchedCategories.add(kw);
      }
    }
  }
  const distinctRolesGe3 = matchedCategories.size >= 3;
  const distinctRolesGe5 = matchedCategories.size >= 5;

  const signals: SignalResult[] = [
    signal("Has custom agents", hasAnyAgents, 2),
    signal("Agent count >= 3", agentCountGe3, 1),
    signal("Agent count >= 5", agentCountGe5, 1),
    signal("Agent count >= 8", agentCountGe8, 1),
    signal("Agent count >= 10", agentCountGe10, 1),
    signal("Has shared agent directory", hasSharedDir, 1),
    signal("Has agents with role-based names", hasRoleBasedNames, 1),
    signal("Has >= 3 distinct role categories", distinctRolesGe3, 1),
    signal("Has >= 5 distinct role categories", distinctRolesGe5, 1),
  ];

  const raw = signals.reduce((sum, s) => sum + s.earned, 0);

  return {
    dimension: "agentCoverage",
    label: "Agent Coverage",
    score: cap(raw, 10),
    maxScore: 10,
    signals,
  };
}

// ---------------------------------------------------------------------------
// D4: Tool Integrations (0–10)
// ---------------------------------------------------------------------------
function scoreToolIntegrations(manifest: AgentScoreManifest): DimensionScore {
  const { mcpServers } = manifest;
  const hasAnyMcp = mcpServers.count > 0;
  const mcpGe2 = mcpServers.count >= 2;
  const mcpGe4 = mcpServers.count >= 4;
  const mcpGe6 = mcpServers.count >= 6;
  const mcpGe8 = mcpServers.count >= 8;

  const hasCodeTool = serverNamesMatch(mcpServers.names, MCP_CODE_TOOLS);
  const hasDesignTool = serverNamesMatch(mcpServers.names, MCP_DESIGN_TOOLS);
  const hasCommunicationTool = serverNamesMatch(
    mcpServers.names,
    MCP_COMMUNICATION_TOOLS
  );
  const hasBrowserTool = serverNamesMatch(mcpServers.names, MCP_BROWSER_TOOLS);

  const signals: SignalResult[] = [
    signal("Has MCP servers configured", hasAnyMcp, 2),
    signal("MCP server count >= 2", mcpGe2, 1),
    signal("MCP server count >= 4", mcpGe4, 1),
    signal("MCP server count >= 6", mcpGe6, 1),
    signal("MCP server count >= 8", mcpGe8, 1),
    signal("Has a code or dev tool (GitHub, GitLab, Jira, Linear…)", hasCodeTool, 1),
    signal("Has a design tool (Figma, tldraw, Canva…)", hasDesignTool, 1),
    signal(
      "Has a communication tool (Telegram, Slack, Discord…)",
      hasCommunicationTool,
      1
    ),
    signal(
      "Has a browser or testing tool (Playwright, Puppeteer…)",
      hasBrowserTool,
      1
    ),
  ];

  const raw = signals.reduce((sum, s) => sum + s.earned, 0);

  return {
    dimension: "toolIntegrations",
    label: "Tool Integrations",
    score: cap(raw, 10),
    maxScore: 10,
    signals,
  };
}

// ---------------------------------------------------------------------------
// D5: Skill Breadth (0–10)
// ---------------------------------------------------------------------------
function scoreSkillBreadth(manifest: AgentScoreManifest): DimensionScore {
  const { commands } = manifest;
  const hasAnyCommands = commands.count > 0;
  const cmdGe3 = commands.count >= 3;
  const cmdGe5 = commands.count >= 5;
  const cmdGe8 = commands.count >= 8;
  const cmdGe12 = commands.count >= 12;
  const cmdGe16 = commands.count >= 16;
  const cmdGe20 = commands.count >= 20;

  const hasWorkflowCommands = commandNamesMatch(
    commands.names,
    WORKFLOW_KEYWORDS
  );
  const hasMetaCommands = commandNamesMatch(commands.names, META_KEYWORDS);

  const signals: SignalResult[] = [
    signal("Has custom commands", hasAnyCommands, 2),
    signal("Command count >= 3", cmdGe3, 1),
    signal("Command count >= 5", cmdGe5, 1),
    signal("Command count >= 8", cmdGe8, 1),
    signal("Command count >= 12", cmdGe12, 1),
    signal("Command count >= 16", cmdGe16, 1),
    signal("Command count >= 20", cmdGe20, 1),
    signal(
      "Has workflow-type commands (deploy, build, review, test, cycle)",
      hasWorkflowCommands,
      1
    ),
    signal(
      "Has meta or management commands (status, daily, start, switch)",
      hasMetaCommands,
      1
    ),
  ];

  const raw = signals.reduce((sum, s) => sum + s.earned, 0);

  return {
    dimension: "skillBreadth",
    label: "Skill Breadth",
    score: cap(raw, 10),
    maxScore: 10,
    signals,
  };
}

// ---------------------------------------------------------------------------
// D6: Workflow Depth (0–10)
// ---------------------------------------------------------------------------
function scoreWorkflowDepth(manifest: AgentScoreManifest): DimensionScore {
  const { workflows, hooks, commands, agents, mcpServers, memory } = manifest;

  const hasPlugins = workflows.hasPlugins;
  const pluginCountGe2 = workflows.pluginNames.length >= 2;
  const hasChannels = workflows.hasChannels;
  const hasMultipleChannelTypes = workflows.channelTypes.length >= 2;

  const hasBothHooksAndCommands =
    hooks.totalHookCount > 0 && commands.count > 0;
  const hasBothAgentsAndCommands = agents.count > 0 && commands.count > 0;
  const hasBothMcpAndHooks = mcpServers.count > 0 && hooks.totalHookCount > 0;

  // Full-stack: agents AND MCP servers AND hooks AND commands
  const isFullStack =
    agents.count > 0 &&
    mcpServers.count > 0 &&
    hooks.totalHookCount > 0 &&
    commands.count > 0;

  const projectDirsGe3 = memory.projectMemoryDirs >= 3;

  const signals: SignalResult[] = [
    signal("Has plugins enabled", hasPlugins, 1),
    signal("Plugin count >= 2", pluginCountGe2, 1),
    signal("Has channels configured", hasChannels, 1),
    signal("Has multiple channel types", hasMultipleChannelTypes, 1),
    signal("Has both hooks and commands", hasBothHooksAndCommands, 1),
    signal("Has both agents and commands", hasBothAgentsAndCommands, 1),
    signal("Has both MCP servers and hooks", hasBothMcpAndHooks, 1),
    signal(
      "Full-stack setup: agents, MCP servers, hooks, and commands",
      isFullStack,
      2
    ),
    signal("Has >= 3 project-specific memory dirs", projectDirsGe3, 1),
  ];

  const raw = signals.reduce((sum, s) => sum + s.earned, 0);

  return {
    dimension: "workflowDepth",
    label: "Workflow Depth",
    score: cap(raw, 10),
    maxScore: 10,
    signals,
  };
}

// ---------------------------------------------------------------------------
// Tier resolution
// ---------------------------------------------------------------------------
function resolveTier(composite: number): Tier {
  if (composite <= 2.0) {
    return { label: "Beginner", description: "Getting Started" };
  }
  if (composite <= 4.0) {
    return { label: "Intermediate", description: "Building Momentum" };
  }
  if (composite <= 6.0) {
    return { label: "Advanced", description: "Power User" };
  }
  if (composite <= 8.0) {
    return { label: "Expert", description: "Ecosystem Architect" };
  }
  return { label: "Master", description: "Full Autonomy" };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------
export function scoreManifest(manifest: AgentScoreManifest): ScoreResult {
  const dimensions = [
    scoreAutomation(manifest),
    scoreMemory(manifest),
    scoreAgentCoverage(manifest),
    scoreToolIntegrations(manifest),
    scoreSkillBreadth(manifest),
    scoreWorkflowDepth(manifest),
  ];

  const sum = dimensions.reduce((acc, d) => acc + d.score, 0);
  const composite = Math.round((sum / dimensions.length) * 10) / 10;
  const tier = resolveTier(composite);

  return { composite, tier, dimensions };
}
