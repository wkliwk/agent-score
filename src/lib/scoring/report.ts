import type { AgentScoreManifest, DimensionScore, NextStep, Report, ScoreResult } from "./types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function topDimensions(
  dimensions: DimensionScore[]
): [DimensionScore, DimensionScore] {
  const sorted = [...dimensions].sort((a, b) => b.score - a.score);
  return [sorted[0], sorted[1]];
}

function bottomDimension(dimensions: DimensionScore[]): DimensionScore {
  return [...dimensions].sort((a, b) => a.score - b.score)[0];
}

// ---------------------------------------------------------------------------
// Strengths: all dimensions scoring >= 7
// ---------------------------------------------------------------------------
function buildStrengths(
  manifest: AgentScoreManifest,
  dimensions: DimensionScore[]
): { dimension: string; explanation: string }[] {
  const strengths: { dimension: string; explanation: string }[] = [];

  for (const dim of dimensions) {
    if (dim.score < 7) continue;

    let explanation = "";

    switch (dim.dimension) {
      case "automation": {
        const { hooks, workflows } = manifest;
        const parts: string[] = [];
        if (hooks.events.length > 0) {
          parts.push(`hooks on ${hooks.events.join(", ")} lifecycle events`);
        }
        if (hooks.hasStatusLine) parts.push("a status line");
        if (workflows.hasCronJobs) parts.push("cron automation");
        if (workflows.hasCustomProxy) parts.push("a custom proxy or fallback");
        explanation = `You have ${parts.join(", ")}.`;
        break;
      }
      case "memory": {
        const { memory } = manifest;
        const parts: string[] = [];
        if (memory.hasMemoryMd) parts.push("a MEMORY.md index");
        parts.push(`${memory.memoryFileCount} memory files`);
        if (memory.memoryCategories.length > 0) {
          parts.push(`${memory.memoryCategories.length} categories (${memory.memoryCategories.join(", ")})`);
        }
        if (memory.projectMemoryDirs > 0) {
          parts.push(`${memory.projectMemoryDirs} project-specific memory dirs`);
        }
        explanation = `Your memory system includes ${parts.join(", ")}.`;
        break;
      }
      case "agentCoverage": {
        const { agents } = manifest;
        const parts: string[] = [];
        parts.push(`${agents.count} agents (${agents.names.join(", ")})`);
        if (agents.hasSharedDir) parts.push("a shared agent directory");
        explanation = `You have ${parts.join(" and ")}.`;
        break;
      }
      case "toolIntegrations": {
        const { mcpServers } = manifest;
        explanation = `You have ${mcpServers.count} MCP servers configured: ${mcpServers.names.join(", ")}.`;
        break;
      }
      case "skillBreadth": {
        const { commands } = manifest;
        explanation = `You have ${commands.count} custom commands covering workflow, meta, and domain-specific tasks.`;
        break;
      }
      case "workflowDepth": {
        const { workflows, agents, mcpServers, hooks, commands } = manifest;
        const parts: string[] = [];
        if (workflows.hasPlugins) {
          parts.push(`plugins (${workflows.pluginNames.join(", ")})`);
        }
        if (workflows.hasChannels) {
          parts.push(`channels (${workflows.channelTypes.join(", ")})`);
        }
        const systems: string[] = [];
        if (agents.count > 0) systems.push("agents");
        if (mcpServers.count > 0) systems.push("MCP servers");
        if (hooks.totalHookCount > 0) systems.push("hooks");
        if (commands.count > 0) systems.push("commands");
        if (systems.length > 0) parts.push(`a full-stack integration of ${systems.join(", ")}`);
        explanation = `Your workflow includes ${parts.join(", ")}.`;
        break;
      }
    }

    strengths.push({ dimension: dim.label, explanation });
  }

  return strengths;
}

// ---------------------------------------------------------------------------
// Growth areas: all dimensions scoring <= 4
// ---------------------------------------------------------------------------
function buildGrowthAreas(
  dimensions: DimensionScore[]
): { dimension: string; suggestion: string }[] {
  const growthAreas: { dimension: string; suggestion: string }[] = [];

  for (const dim of dimensions) {
    if (dim.score > 4) continue;

    let suggestion = "";

    switch (dim.dimension) {
      case "automation":
        suggestion =
          "Add lifecycle hooks (UserPromptSubmit, PreToolUse, Stop) to automate your workflow (+5 to Automation). Configure a status line and custom proxy for additional gains.";
        break;
      case "memory":
        suggestion =
          "Create a MEMORY.md index file to organize your knowledge (+2 to Memory). Add more memory files and category groupings for further gains.";
        break;
      case "agentCoverage":
        suggestion =
          "Define custom agents with role-based names (dev, qa, pm, ops, etc.) to cover key workflow roles (+2 to Agent Coverage). A shared agent directory unlocks additional points.";
        break;
      case "toolIntegrations":
        suggestion =
          "Connect MCP servers for your key tools — add a code tool (GitHub, Linear), a design tool (Figma), and a communication tool (Slack, Telegram) to gain up to +7 points.";
        break;
      case "skillBreadth":
        suggestion =
          "Add custom commands, especially workflow-type (build, deploy, review, test) and meta commands (status, daily, start) to increase your skill breadth score.";
        break;
      case "workflowDepth":
        suggestion =
          "Enable plugins and channels, and make sure you have hooks, agents, MCP servers, and commands all active together for the full-stack bonus (+2 to Workflow Depth).";
        break;
    }

    growthAreas.push({ dimension: dim.label, suggestion });
  }

  return growthAreas;
}

// ---------------------------------------------------------------------------
// Next steps: up to 3 highest-impact unmet signals
// ---------------------------------------------------------------------------
function buildNextSteps(dimensions: DimensionScore[]): NextStep[] {
  const unmet: NextStep[] = [];

  for (const dim of dimensions) {
    for (const sig of dim.signals) {
      if (!sig.met && sig.max > 0) {
        unmet.push({
          action: sig.signal,
          dimension: dim.label,
          pointsGain: sig.max,
        });
      }
    }
  }

  // Sort by pointsGain descending, take top 3
  return unmet.sort((a, b) => b.pointsGain - a.pointsGain).slice(0, 3);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------
export function generateReport(
  manifest: AgentScoreManifest,
  score: ScoreResult
): Report {
  const { dimensions } = score;

  const [top1, top2] = topDimensions(dimensions);
  const bottom1 = bottomDimension(dimensions);

  const personality = `Your ecosystem is a ${top1.label}-heavy, ${top2.label}-rich setup with room to grow in ${bottom1.label}.`;

  const strengths = buildStrengths(manifest, dimensions);
  const growthAreas = buildGrowthAreas(dimensions);
  const nextSteps = buildNextSteps(dimensions);

  return { personality, strengths, growthAreas, nextSteps };
}
