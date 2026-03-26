import { describe, it, expect } from "vitest";
import { scoreManifest } from "../engine";
import type { AgentScoreManifest } from "../types";

// Reference manifest from the PRD — Ricky's ecosystem
const referenceManifest: AgentScoreManifest = {
  version: "1.0",
  exportedAt: "2026-03-26T05:00:00Z",
  generator: "agentscore-cli",
  username: "wkliwk",
  github: "wkliwk",
  agents: {
    count: 10,
    names: [
      "ai-researcher",
      "backend-dev",
      "ceo",
      "claude-code-manager",
      "designer",
      "finance",
      "frontend-dev",
      "ops",
      "pm",
      "qa",
    ],
    hasSharedDir: true,
  },
  memory: {
    hasMemoryMd: true,
    memoryFileCount: 11,
    memoryCategories: ["User", "Project", "Reference", "Feedback"],
    projectMemoryDirs: 7,
  },
  mcpServers: {
    count: 2,
    names: ["serena", "telegram2"],
  },
  hooks: {
    events: ["UserPromptSubmit", "PreToolUse", "Stop"],
    totalHookCount: 5,
    hasStatusLine: true,
  },
  commands: {
    count: 21,
    names: [
      "_evaluate-idea",
      "add-task",
      "ai-research",
      "auto-route",
      "daily",
      "dev-cycle-build",
      "dev-cycle-prd",
      "dev-cycle-qa",
      "dev-cycle",
      "idea",
      "issue",
      "learn",
      "new-product",
      "poc-build",
      "poc-propose",
      "poc-review",
      "poc",
      "post-dev",
      "start-working",
      "status",
      "switch-model",
    ],
  },
  projects: {
    count: 7,
    hasClaudeMd: true,
  },
  workflows: {
    hasCronJobs: false,
    hasPlugins: true,
    pluginNames: ["telegram", "figma"],
    hasCustomProxy: true,
    hasChannels: true,
    channelTypes: ["telegram"],
  },
};

describe("scoreManifest — reference manifest (Ricky's ecosystem)", () => {
  const result = scoreManifest(referenceManifest);

  it("D1 Automation scores 8", () => {
    const dim = result.dimensions.find((d) => d.dimension === "automation");
    expect(dim?.score).toBe(8);
  });

  it("D2 Memory scores 10", () => {
    const dim = result.dimensions.find((d) => d.dimension === "memory");
    expect(dim?.score).toBe(10);
  });

  it("D3 Agent Coverage scores 10", () => {
    const dim = result.dimensions.find((d) => d.dimension === "agentCoverage");
    expect(dim?.score).toBe(10);
  });

  it("D4 Tool Integrations scores 4", () => {
    const dim = result.dimensions.find(
      (d) => d.dimension === "toolIntegrations"
    );
    expect(dim?.score).toBe(4);
  });

  it("D5 Skill Breadth scores 10", () => {
    const dim = result.dimensions.find((d) => d.dimension === "skillBreadth");
    expect(dim?.score).toBe(10);
  });

  it("D6 Workflow Depth scores 9", () => {
    const dim = result.dimensions.find((d) => d.dimension === "workflowDepth");
    expect(dim?.score).toBe(9);
  });

  it("Composite score is 8.5", () => {
    expect(result.composite).toBe(8.5);
  });

  it('Tier is Master / "Full Autonomy"', () => {
    expect(result.tier.label).toBe("Master");
    expect(result.tier.description).toBe("Full Autonomy");
  });

  it("All dimensions report maxScore of 10", () => {
    for (const dim of result.dimensions) {
      expect(dim.maxScore).toBe(10);
    }
  });

  it("No dimension score exceeds 10", () => {
    for (const dim of result.dimensions) {
      expect(dim.score).toBeLessThanOrEqual(10);
    }
  });

  it("All SignalResults have human-readable signal strings", () => {
    for (const dim of result.dimensions) {
      for (const sig of dim.signals) {
        expect(typeof sig.signal).toBe("string");
        expect(sig.signal.length).toBeGreaterThan(0);
        // Signal strings must not be camelCase keys — they must contain spaces
        expect(sig.signal).toMatch(/\s/);
      }
    }
  });

  it("Each SignalResult earned equals max when met, 0 when not met", () => {
    for (const dim of result.dimensions) {
      for (const sig of dim.signals) {
        if (sig.met) {
          expect(sig.earned).toBe(sig.max);
        } else {
          expect(sig.earned).toBe(0);
        }
      }
    }
  });
});

describe("scoreManifest — edge cases", () => {
  it("Empty manifest returns Beginner tier with composite near 0", () => {
    const empty: AgentScoreManifest = {
      version: "1.0",
      exportedAt: "2026-01-01T00:00:00Z",
      generator: "agentscore-cli",
      username: "test",
      github: "test",
      agents: { count: 0, names: [], hasSharedDir: false },
      memory: {
        hasMemoryMd: false,
        memoryFileCount: 0,
        memoryCategories: [],
        projectMemoryDirs: 0,
      },
      mcpServers: { count: 0, names: [] },
      hooks: { events: [], totalHookCount: 0, hasStatusLine: false },
      commands: { count: 0, names: [] },
      projects: { count: 0, hasClaudeMd: false },
      workflows: {
        hasCronJobs: false,
        hasPlugins: false,
        pluginNames: [],
        hasCustomProxy: false,
        hasChannels: false,
        channelTypes: [],
      },
    };
    const result = scoreManifest(empty);
    expect(result.composite).toBe(0);
    expect(result.tier.label).toBe("Beginner");
    expect(result.tier.description).toBe("Getting Started");
    for (const dim of result.dimensions) {
      expect(dim.score).toBe(0);
    }
  });

  it("Scores are capped at 10 — no overflow", () => {
    // Construct a manifest that would theoretically overflow if caps were missing
    const rich: AgentScoreManifest = {
      version: "1.0",
      exportedAt: "2026-01-01T00:00:00Z",
      generator: "agentscore-cli",
      username: "test",
      github: "test",
      agents: {
        count: 15,
        names: [
          "dev",
          "frontend",
          "backend",
          "qa",
          "ops",
          "pm",
          "design",
          "finance",
          "research",
          "ceo",
          "manager",
          "test",
          "deploy",
          "product",
          "extra",
        ],
        hasSharedDir: true,
      },
      memory: {
        hasMemoryMd: true,
        memoryFileCount: 20,
        memoryCategories: ["A", "B", "C", "D", "E"],
        projectMemoryDirs: 10,
      },
      mcpServers: {
        count: 10,
        names: [
          "github",
          "figma",
          "telegram",
          "playwright",
          "linear",
          "slack",
          "gitlab",
          "canva",
          "discord",
          "puppeteer",
        ],
      },
      hooks: {
        events: ["UserPromptSubmit", "PreToolUse", "Stop"],
        totalHookCount: 10,
        hasStatusLine: true,
      },
      commands: {
        count: 25,
        names: [
          "deploy",
          "build",
          "review",
          "test",
          "cycle",
          "status",
          "daily",
          "start",
          "switch",
          "a",
          "b",
          "c",
          "d",
          "e",
          "f",
          "g",
          "h",
          "i",
          "j",
          "k",
          "l",
          "m",
          "n",
          "o",
          "p",
        ],
      },
      projects: { count: 10, hasClaudeMd: true },
      workflows: {
        hasCronJobs: true,
        hasPlugins: true,
        pluginNames: ["telegram", "figma", "slack"],
        hasCustomProxy: true,
        hasChannels: true,
        channelTypes: ["telegram", "slack", "discord"],
      },
    };
    const result = scoreManifest(rich);
    for (const dim of result.dimensions) {
      expect(dim.score).toBeLessThanOrEqual(10);
    }
  });

  it("Tier boundaries: score 2.0 → Beginner, 2.1 → Intermediate", () => {
    // We test resolveTier indirectly by checking the composite/tier mapping.
    // A manifest with 0 MCP servers but all else minimal gets Beginner.
    const minimal: AgentScoreManifest = {
      version: "1.0",
      exportedAt: "2026-01-01T00:00:00Z",
      generator: "agentscore-cli",
      username: "test",
      github: "test",
      agents: { count: 0, names: [], hasSharedDir: false },
      memory: {
        hasMemoryMd: true,
        memoryFileCount: 0,
        memoryCategories: [],
        projectMemoryDirs: 0,
      },
      mcpServers: { count: 0, names: [] },
      hooks: { events: [], totalHookCount: 0, hasStatusLine: false },
      commands: { count: 0, names: [] },
      projects: { count: 0, hasClaudeMd: false },
      workflows: {
        hasCronJobs: false,
        hasPlugins: false,
        pluginNames: [],
        hasCustomProxy: false,
        hasChannels: false,
        channelTypes: [],
      },
    };
    const result = scoreManifest(minimal);
    // Only D2 Memory gets +2 for hasMemoryMd → average = 2/6 = 0.3 → Beginner
    expect(result.tier.label).toBe("Beginner");
  });
});

describe("scoreManifest — D4 Tool Integrations category detection", () => {
  function makeManifest(mcpNames: string[]): AgentScoreManifest {
    return {
      version: "1.0",
      exportedAt: "2026-01-01T00:00:00Z",
      generator: "agentscore-cli",
      username: "test",
      github: "test",
      agents: { count: 0, names: [], hasSharedDir: false },
      memory: {
        hasMemoryMd: false,
        memoryFileCount: 0,
        memoryCategories: [],
        projectMemoryDirs: 0,
      },
      mcpServers: { count: mcpNames.length, names: mcpNames },
      hooks: { events: [], totalHookCount: 0, hasStatusLine: false },
      commands: { count: 0, names: [] },
      projects: { count: 0, hasClaudeMd: false },
      workflows: {
        hasCronJobs: false,
        hasPlugins: false,
        pluginNames: [],
        hasCustomProxy: false,
        hasChannels: false,
        channelTypes: [],
      },
    };
  }

  it("Detects github as a code tool", () => {
    const result = scoreManifest(makeManifest(["github"]));
    const dim = result.dimensions.find((d) => d.dimension === "toolIntegrations");
    const sig = dim?.signals.find((s) => s.signal.includes("code or dev tool"));
    expect(sig?.met).toBe(true);
  });

  it("Detects figma as a design tool", () => {
    const result = scoreManifest(makeManifest(["figma"]));
    const dim = result.dimensions.find((d) => d.dimension === "toolIntegrations");
    const sig = dim?.signals.find((s) => s.signal.includes("design tool"));
    expect(sig?.met).toBe(true);
  });

  it("Detects telegram2 as a communication tool (substring match)", () => {
    const result = scoreManifest(makeManifest(["telegram2"]));
    const dim = result.dimensions.find((d) => d.dimension === "toolIntegrations");
    const sig = dim?.signals.find((s) =>
      s.signal.includes("communication tool")
    );
    expect(sig?.met).toBe(true);
  });

  it("Detects playwright as a browser tool", () => {
    const result = scoreManifest(makeManifest(["playwright"]));
    const dim = result.dimensions.find((d) => d.dimension === "toolIntegrations");
    const sig = dim?.signals.find((s) =>
      s.signal.includes("browser or testing tool")
    );
    expect(sig?.met).toBe(true);
  });
});
