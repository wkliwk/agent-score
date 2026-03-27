import chalk from "chalk";
import type { AgentScoreManifest } from "./scanner.js";

interface DimPreview {
  label: string;
  score: number;
  max: number;
}

const MCP_CODE_TOOLS = ["github", "gitlab", "bitbucket", "jira", "linear"];
const MCP_DESIGN_TOOLS = ["figma", "tldraw", "canva"];
const MCP_COMM_TOOLS = ["telegram", "slack", "discord", "email", "gmail"];
const MCP_BROWSER_TOOLS = ["playwright", "puppeteer", "selenium", "browserbase"];
const WORKFLOW_KEYWORDS = ["deploy", "build", "review", "test", "cycle"];
const META_KEYWORDS = ["status", "daily", "start", "switch"];
const ROLE_KEYWORDS = ["dev", "frontend", "backend", "qa", "test", "ops", "deploy", "pm", "product", "design", "finance", "research", "ceo", "manager"];

function namesMatch(names: string[], keywords: string[]): boolean {
  return names.some((n) => keywords.some((kw) => n.toLowerCase().includes(kw)));
}

function cap(v: number, max: number): number {
  return Math.min(v, max);
}

function scoreAutomation(m: AgentScoreManifest): number {
  let s = 0;
  if (m.hooks.totalHookCount > 0) s += 2;
  if (m.hooks.events.includes("UserPromptSubmit")) s += 1;
  if (m.hooks.events.includes("PreToolUse")) s += 1;
  if (m.hooks.events.includes("Stop")) s += 1;
  if (m.hooks.totalHookCount >= 3) s += 1;
  if (m.hooks.totalHookCount >= 6) s += 1;
  if (m.hooks.hasStatusLine) s += 1;
  if (m.workflows.hasCronJobs) s += 1;
  if (m.workflows.hasCustomProxy) s += 1;
  return cap(s, 10);
}

function scoreMemory(m: AgentScoreManifest): number {
  let s = 0;
  if (m.memory.hasMemoryMd) s += 2;
  if (m.memory.memoryFileCount >= 3) s += 1;
  if (m.memory.memoryFileCount >= 6) s += 1;
  if (m.memory.memoryFileCount >= 10) s += 1;
  if (m.memory.memoryCategories.length >= 2) s += 1;
  if (m.memory.memoryCategories.length >= 4) s += 1;
  if (m.memory.projectMemoryDirs >= 1) s += 1;
  if (m.memory.projectMemoryDirs >= 3) s += 1;
  if (m.memory.projectMemoryDirs >= 5) s += 1;
  return cap(s, 10);
}

function scoreAgentCoverage(m: AgentScoreManifest): number {
  let s = 0;
  if (m.agents.count > 0) s += 2;
  if (m.agents.count >= 3) s += 1;
  if (m.agents.count >= 5) s += 1;
  if (m.agents.count >= 8) s += 1;
  if (m.agents.count >= 10) s += 1;
  if (m.agents.hasSharedDir) s += 1;
  const lower = m.agents.names.map((n) => n.toLowerCase());
  if (ROLE_KEYWORDS.some((kw) => lower.some((n) => n.includes(kw)))) s += 1;
  const matched = new Set<string>();
  for (const n of lower) for (const kw of ROLE_KEYWORDS) if (n.includes(kw)) matched.add(kw);
  if (matched.size >= 3) s += 1;
  if (matched.size >= 5) s += 1;
  return cap(s, 10);
}

function scoreToolIntegrations(m: AgentScoreManifest): number {
  let s = 0;
  if (m.mcpServers.count > 0) s += 2;
  if (m.mcpServers.count >= 2) s += 1;
  if (m.mcpServers.count >= 4) s += 1;
  if (m.mcpServers.count >= 6) s += 1;
  if (m.mcpServers.count >= 8) s += 1;
  if (namesMatch(m.mcpServers.names, MCP_CODE_TOOLS)) s += 1;
  if (namesMatch(m.mcpServers.names, MCP_DESIGN_TOOLS)) s += 1;
  if (namesMatch(m.mcpServers.names, MCP_COMM_TOOLS)) s += 1;
  if (namesMatch(m.mcpServers.names, MCP_BROWSER_TOOLS)) s += 1;
  return cap(s, 10);
}

function scoreSkillBreadth(m: AgentScoreManifest): number {
  let s = 0;
  if (m.commands.count > 0) s += 2;
  if (m.commands.count >= 3) s += 1;
  if (m.commands.count >= 5) s += 1;
  if (m.commands.count >= 8) s += 1;
  if (m.commands.count >= 12) s += 1;
  if (m.commands.count >= 16) s += 1;
  if (m.commands.count >= 20) s += 1;
  if (namesMatch(m.commands.names, WORKFLOW_KEYWORDS)) s += 1;
  if (namesMatch(m.commands.names, META_KEYWORDS)) s += 1;
  return cap(s, 10);
}

function scoreWorkflowDepth(m: AgentScoreManifest): number {
  let s = 0;
  if (m.workflows.hasPlugins) s += 1;
  if (m.workflows.pluginNames.length >= 2) s += 1;
  if (m.workflows.hasChannels) s += 1;
  if (m.workflows.channelTypes.length >= 2) s += 1;
  if (m.hooks.totalHookCount > 0 && m.commands.count > 0) s += 1;
  if (m.agents.count > 0 && m.commands.count > 0) s += 1;
  if (m.mcpServers.count > 0 && m.hooks.totalHookCount > 0) s += 1;
  if (m.agents.count > 0 && m.mcpServers.count > 0 && m.hooks.totalHookCount > 0 && m.commands.count > 0) s += 2;
  if (m.memory.projectMemoryDirs >= 3) s += 1;
  return cap(s, 10);
}

function getTier(composite: number): string {
  if (composite <= 2.0) return "Beginner";
  if (composite <= 4.0) return "Intermediate";
  if (composite <= 6.0) return "Advanced";
  if (composite <= 8.0) return "Expert";
  return "Master";
}

function bar(score: number, max: number, color: (text: string) => string): string {
  const filled = Math.round((score / max) * 20);
  const empty = 20 - filled;
  return color("█".repeat(filled)) + chalk.gray("░".repeat(empty));
}

export function previewScore(manifest: AgentScoreManifest): void {
  const dims: DimPreview[] = [
    { label: "Automation", score: scoreAutomation(manifest), max: 10 },
    { label: "Memory", score: scoreMemory(manifest), max: 10 },
    { label: "Agent Coverage", score: scoreAgentCoverage(manifest), max: 10 },
    { label: "Tool Integrations", score: scoreToolIntegrations(manifest), max: 10 },
    { label: "Skill Breadth", score: scoreSkillBreadth(manifest), max: 10 },
    { label: "Workflow Depth", score: scoreWorkflowDepth(manifest), max: 10 },
  ];

  const sum = dims.reduce((s, d) => s + d.score, 0);
  const composite = Math.round((sum / 6) * 10) / 10;
  const tier = getTier(composite);

  const colors = [chalk.blue, chalk.green, chalk.magenta, chalk.yellow, chalk.red, chalk.cyan];

  process.stdout.write("\n" + chalk.bold("  Estimated AgentScore Preview\n"));
  process.stdout.write(chalk.gray("  ─".repeat(24)) + "\n\n");

  for (let i = 0; i < dims.length; i++) {
    const d = dims[i];
    const label = d.label.padEnd(18);
    process.stdout.write(`  ${colors[i](label)} ${bar(d.score, d.max, colors[i])} ${chalk.white(String(d.score).padStart(2))}/${d.max}\n`);
  }

  process.stdout.write("\n");
  process.stdout.write(chalk.bold(`  Composite: ${composite} / 10`) + chalk.gray(` (${tier})`) + "\n");
  process.stdout.write(chalk.gray(`  Calculation: (${dims.map((d) => d.score).join(" + ")}) / 6 = ${composite}`) + "\n\n");
}
