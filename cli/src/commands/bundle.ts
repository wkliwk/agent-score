import fs from "fs";
import path from "path";
import os from "os";
import readline from "readline";
import chalk from "chalk";
import ora from "ora";
import { scanFiles, printScanResults } from "../credential-scanner.js";
import { getToken, isTokenExpired } from "../auth.js";
import { runLogin } from "./login.js";

const CLAUDE_DIR = path.join(os.homedir(), ".claude");
const API_URL = process.env["AGENTSCORE_API_URL"] ?? "https://agentscore.dev";

export interface BundleFile {
  path: string;
  category: "agent" | "command" | "memory-index" | "hooks-structure";
  content: string;
}

export interface Bundle {
  version: "1.0";
  createdAt: string;
  username: string;
  files: BundleFile[];
  slices: {
    agents: string[];
    skills: string[];
    memoryStructure: boolean;
    hooksStructure: boolean;
  };
}

function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => { rl.close(); resolve(answer); });
  });
}

function safeReadFile(filePath: string): string | null {
  try {
    return fs.readFileSync(filePath, "utf-8");
  } catch {
    return null;
  }
}

function safeReadDir(dirPath: string): string[] {
  try {
    return fs.readdirSync(dirPath);
  } catch {
    return [];
  }
}

function collectBundleFiles(): BundleFile[] {
  const files: BundleFile[] = [];

  // Agents: ~/.claude/agents/*.md
  const agentsDir = path.join(CLAUDE_DIR, "agents");
  for (const entry of safeReadDir(agentsDir)) {
    if (!entry.endsWith(".md")) continue;
    const fullPath = path.join(agentsDir, entry);
    const content = safeReadFile(fullPath);
    if (content !== null) {
      files.push({ path: `agents/${entry}`, category: "agent", content });
    }
  }

  // Shared agents: ~/.claude/agents/shared/*.md
  const sharedDir = path.join(agentsDir, "shared");
  for (const entry of safeReadDir(sharedDir)) {
    if (!entry.endsWith(".md")) continue;
    const fullPath = path.join(sharedDir, entry);
    const content = safeReadFile(fullPath);
    if (content !== null) {
      files.push({ path: `agents/shared/${entry}`, category: "agent", content });
    }
  }

  // Commands: ~/.claude/commands/*.md
  const commandsDir = path.join(CLAUDE_DIR, "commands");
  for (const entry of safeReadDir(commandsDir)) {
    if (!entry.endsWith(".md")) continue;
    const fullPath = path.join(commandsDir, entry);
    const content = safeReadFile(fullPath);
    if (content !== null) {
      files.push({ path: `commands/${entry}`, category: "command", content });
    }
  }

  // MEMORY.md index (structure only, not individual memory files)
  // Scan all project memory dirs for MEMORY.md
  const projectsDir = path.join(CLAUDE_DIR, "projects");
  for (const proj of safeReadDir(projectsDir)) {
    const memMd = path.join(projectsDir, proj, "memory", "MEMORY.md");
    const content = safeReadFile(memMd);
    if (content !== null) {
      // Strip any file contents, keep only the index structure
      files.push({
        path: `memory/MEMORY.md`,
        category: "memory-index",
        content,
      });
      break; // Only include one MEMORY.md
    }
  }

  // Hooks structure (event names only, never command strings)
  const settingsPath = path.join(CLAUDE_DIR, "settings.json");
  const settingsContent = safeReadFile(settingsPath);
  if (settingsContent !== null) {
    try {
      const settings = JSON.parse(settingsContent) as Record<string, unknown>;
      const hooks = settings["hooks"];
      if (hooks && typeof hooks === "object") {
        // Extract only event names (keys), not the hook command content
        const eventNames = Object.keys(hooks as Record<string, unknown>);
        files.push({
          path: "hooks-structure.json",
          category: "hooks-structure",
          content: JSON.stringify({ events: eventNames }, null, 2),
        });
      }
    } catch {
      // invalid settings.json
    }
  }

  return files;
}

function displayFiles(files: BundleFile[]): void {
  const agents = files.filter((f) => f.category === "agent");
  const commands = files.filter((f) => f.category === "command");
  const memory = files.filter((f) => f.category === "memory-index");
  const hooks = files.filter((f) => f.category === "hooks-structure");

  process.stdout.write(chalk.bold("\n  Bundle Contents\n"));
  process.stdout.write(chalk.gray("  " + "─".repeat(48)) + "\n\n");

  if (agents.length > 0) {
    process.stdout.write(chalk.cyan(`  Agents (${agents.length})\n`));
    for (const f of agents) {
      process.stdout.write(chalk.white(`    ${f.path}`) + chalk.gray(` (${f.content.length} chars)\n`));
    }
    process.stdout.write("\n");
  }

  if (commands.length > 0) {
    process.stdout.write(chalk.cyan(`  Commands (${commands.length})\n`));
    for (const f of commands) {
      process.stdout.write(chalk.white(`    ${f.path}`) + chalk.gray(` (${f.content.length} chars)\n`));
    }
    process.stdout.write("\n");
  }

  if (memory.length > 0) {
    process.stdout.write(chalk.cyan("  Memory Structure\n"));
    process.stdout.write(chalk.white("    MEMORY.md index (structure only)\n\n"));
  }

  if (hooks.length > 0) {
    process.stdout.write(chalk.cyan("  Hooks Structure\n"));
    process.stdout.write(chalk.white("    Event names only (no commands)\n\n"));
  }
}

async function displayFileContents(files: BundleFile[]): Promise<void> {
  for (const f of files) {
    process.stdout.write(chalk.bold.cyan(`\n  ── ${f.path} ──\n`));
    const lines = f.content.split("\n");
    for (let i = 0; i < lines.length; i++) {
      process.stdout.write(chalk.gray(`  ${String(i + 1).padStart(3)} │ `) + chalk.white(lines[i]) + "\n");
    }
  }
  process.stdout.write("\n");
}

export async function runBundle(): Promise<void> {
  // 1. Get username
  let auth = getToken();
  let username = auth?.username ?? "";

  if (username === "") {
    username = await prompt(chalk.cyan("Enter your username: "));
    username = username.trim();
    if (username === "") {
      process.stdout.write(chalk.red("Username is required.\n"));
      return;
    }
  }

  // 2. Collect files
  const scanSpinner = ora("Scanning ~/.claude/ for bundleable files...").start();
  const files = collectBundleFiles();
  scanSpinner.succeed(chalk.green(`Found ${files.length} files to bundle.`));

  if (files.length === 0) {
    process.stdout.write(chalk.yellow("\nNo agent or command files found in ~/.claude/.\n"));
    process.stdout.write(chalk.gray("Create agents in ~/.claude/agents/ or commands in ~/.claude/commands/ first.\n"));
    return;
  }

  // 3. Display summary
  displayFiles(files);

  // 4. Credential scan
  process.stdout.write(chalk.bold("  Security Scan\n"));
  process.stdout.write(chalk.gray("  " + "─".repeat(48)) + "\n");
  const fileMap = new Map(files.map((f) => [f.path, f.content]));
  const scanResults = scanFiles(fileMap);
  printScanResults(scanResults);

  if (scanResults.length > 0) {
    process.stdout.write(chalk.red.bold("\n  Bundle blocked — secrets detected in files above.\n"));
    process.stdout.write(chalk.gray("  Remove the secrets and try again.\n\n"));
    return;
  }

  // 5. Show full contents for review
  const showAll = await prompt(chalk.bold("\nReview full file contents before publishing? (y/n): "));
  if (showAll.trim().toLowerCase() === "y") {
    await displayFileContents(files);
  }

  // 6. Confirm
  const confirm = await prompt(chalk.bold("Publish this bundle to AgentScore? (y/n): "));
  if (confirm.trim().toLowerCase() !== "y") {
    process.stdout.write(chalk.yellow("Bundle cancelled.\n"));
    return;
  }

  // 7. Build bundle object
  const bundle: Bundle = {
    version: "1.0",
    createdAt: new Date().toISOString(),
    username,
    files,
    slices: {
      agents: files.filter((f) => f.category === "agent").map((f) => f.path),
      skills: files.filter((f) => f.category === "command").map((f) => f.path),
      memoryStructure: files.some((f) => f.category === "memory-index"),
      hooksStructure: files.some((f) => f.category === "hooks-structure"),
    },
  };

  // 8. Ensure auth
  auth = getToken();
  if (auth === null || isTokenExpired(auth)) {
    process.stdout.write(chalk.yellow("\nYou need to log in before publishing.\n\n"));
    await runLogin();
    auth = getToken();
    if (auth === null) {
      process.stdout.write(chalk.red("Login failed. Cannot publish bundle.\n"));
      return;
    }
  }

  // 9. Submit
  const submitSpinner = ora("Publishing bundle...").start();
  try {
    const res = await fetch(`${API_URL}/api/bundles`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${auth.token}`,
      },
      body: JSON.stringify(bundle),
    });

    if (!res.ok) {
      const body = await res.text();
      submitSpinner.fail(chalk.red(`Publish failed (${res.status}): ${body}`));
      return;
    }

    submitSpinner.succeed(chalk.green("Bundle published successfully."));
    process.stdout.write(
      "\n" +
        chalk.cyan("Bundle page: ") +
        chalk.bold.white(`${API_URL}/u/${username}#bundle`) +
        "\n\n" +
        chalk.gray("Others can install with: ") +
        chalk.white(`npx agentscore import @${username}`) +
        "\n"
    );
  } catch (err) {
    submitSpinner.fail(chalk.red(`Network error: ${String(err)}`));
  }
}
