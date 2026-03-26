import fs from "fs";
import path from "path";
import os from "os";

export interface AgentScoreManifest {
  version: "1.0";
  exportedAt: string;
  generator: "agentscore-cli" | "manual";
  username: string;
  github?: string;
  agents: { count: number; names: string[]; hasSharedDir: boolean };
  memory: {
    hasMemoryMd: boolean;
    memoryFileCount: number;
    memoryCategories: string[];
    projectMemoryDirs: number;
  };
  mcpServers: { count: number; names: string[] };
  hooks: { events: string[]; totalHookCount: number; hasStatusLine: boolean };
  commands: { count: number; names: string[] };
  projects: { count: number; hasClaudeMd: boolean };
  workflows: {
    hasCronJobs: boolean;
    hasPlugins: boolean;
    pluginNames: string[];
    hasCustomProxy: boolean;
    hasChannels: boolean;
    channelTypes: string[];
  };
}

const CLAUDE_DIR = path.join(os.homedir(), ".claude");

function safeReadDir(dirPath: string): string[] {
  try {
    return fs.readdirSync(dirPath);
  } catch {
    return [];
  }
}

function safeReadJson(filePath: string): Record<string, unknown> | null {
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function isDirectory(fullPath: string): boolean {
  try {
    return fs.statSync(fullPath).isDirectory();
  } catch {
    return false;
  }
}

function fileExists(filePath: string): boolean {
  try {
    fs.accessSync(filePath);
    return true;
  } catch {
    return false;
  }
}

function scanAgents(): AgentScoreManifest["agents"] {
  const agentsDir = path.join(CLAUDE_DIR, "agents");
  const entries = safeReadDir(agentsDir);
  const mdFiles = entries.filter(
    (e) => e.endsWith(".md") && !isDirectory(path.join(agentsDir, e))
  );
  const names = mdFiles.map((f) => path.basename(f, ".md"));
  const hasSharedDir = isDirectory(path.join(agentsDir, "shared"));
  return { count: names.length, names, hasSharedDir };
}

function scanMemory(): AgentScoreManifest["memory"] {
  const projectsDir = path.join(CLAUDE_DIR, "projects");
  const projectEntries = safeReadDir(projectsDir);

  let memoryMdPath: string | null = null;
  let projectMemoryDirs = 0;

  for (const entry of projectEntries) {
    const memDir = path.join(projectsDir, entry, "memory");
    const memMd = path.join(memDir, "MEMORY.md");
    if (fileExists(memMd)) {
      projectMemoryDirs++;
      if (memoryMdPath === null) {
        memoryMdPath = memMd;
      }
    }
  }

  const hasMemoryMd = memoryMdPath !== null;

  if (!hasMemoryMd || memoryMdPath === null) {
    return {
      hasMemoryMd: false,
      memoryFileCount: 0,
      memoryCategories: [],
      projectMemoryDirs: 0,
    };
  }

  // Count .md files in the memory dir (sibling to MEMORY.md)
  const memDir = path.dirname(memoryMdPath);
  const memFiles = safeReadDir(memDir).filter(
    (f) => f.endsWith(".md") && !isDirectory(path.join(memDir, f))
  );

  // Extract ## Heading lines from MEMORY.md — we read only the headings, not body content
  let memoryCategories: string[] = [];
  try {
    const content = fs.readFileSync(memoryMdPath, "utf-8");
    memoryCategories = content
      .split("\n")
      .filter((line) => /^## /.test(line))
      .map((line) => line.replace(/^## /, "").trim());
  } catch {
    memoryCategories = [];
  }

  return {
    hasMemoryMd: true,
    memoryFileCount: memFiles.length,
    memoryCategories,
    projectMemoryDirs,
  };
}

function scanMcpServers(): AgentScoreManifest["mcpServers"] {
  const mcpPath = path.join(CLAUDE_DIR, "mcp.json");
  const mcpJson = safeReadJson(mcpPath);

  const names: string[] = [];

  if (mcpJson !== null) {
    // Only read top-level keys under "mcpServers" — never values
    const servers = mcpJson["mcpServers"];
    if (servers !== null && typeof servers === "object" && !Array.isArray(servers)) {
      names.push(...Object.keys(servers as Record<string, unknown>));
    }
  }

  // Also check settings.json enabledPlugins for plugin-based MCP servers
  const settingsPath = path.join(CLAUDE_DIR, "settings.json");
  const settings = safeReadJson(settingsPath);
  if (settings !== null) {
    const plugins = settings["enabledPlugins"];
    if (plugins !== null && typeof plugins === "object" && !Array.isArray(plugins)) {
      const pluginKeys = Object.keys(plugins as Record<string, unknown>);
      for (const key of pluginKeys) {
        if (!names.includes(key)) {
          names.push(key);
        }
      }
    }
  }

  return { count: names.length, names };
}

function scanHooks(): AgentScoreManifest["hooks"] {
  const settingsPath = path.join(CLAUDE_DIR, "settings.json");
  const settings = safeReadJson(settingsPath);

  if (settings === null) {
    return { events: [], totalHookCount: 0, hasStatusLine: false };
  }

  const hooksRaw = settings["hooks"];
  let events: string[] = [];
  let totalHookCount = 0;

  if (hooksRaw !== null && typeof hooksRaw === "object" && !Array.isArray(hooksRaw)) {
    const hooksObj = hooksRaw as Record<string, unknown>;
    events = Object.keys(hooksObj);

    for (const event of events) {
      const eventHooks = hooksObj[event];
      if (Array.isArray(eventHooks)) {
        // Each entry may be { hooks: [...] } or a hook directly
        for (const entry of eventHooks) {
          if (
            typeof entry === "object" &&
            entry !== null &&
            "hooks" in (entry as Record<string, unknown>)
          ) {
            const inner = (entry as Record<string, unknown>)["hooks"];
            if (Array.isArray(inner)) {
              totalHookCount += inner.length;
            }
          } else {
            totalHookCount += 1;
          }
        }
      }
    }
  }

  const hasStatusLine = "statusLine" in settings && settings["statusLine"] !== null;

  return { events, totalHookCount, hasStatusLine };
}

function scanCommands(): AgentScoreManifest["commands"] {
  const commandsDir = path.join(CLAUDE_DIR, "commands");
  const entries = safeReadDir(commandsDir);
  const mdFiles = entries.filter(
    (e) => e.endsWith(".md") && !isDirectory(path.join(commandsDir, e))
  );
  const names = mdFiles.map((f) => path.basename(f, ".md"));
  return { count: names.length, names };
}

function scanProjects(): AgentScoreManifest["projects"] {
  const projectsDir = path.join(CLAUDE_DIR, "projects");
  const entries = safeReadDir(projectsDir);
  const dirs = entries.filter((e) => isDirectory(path.join(projectsDir, e)));

  let hasClaudeMd = false;
  for (const dir of dirs) {
    if (fileExists(path.join(projectsDir, dir, "CLAUDE.md"))) {
      hasClaudeMd = true;
      break;
    }
  }

  return { count: dirs.length, hasClaudeMd };
}

function scanWorkflows(): AgentScoreManifest["workflows"] {
  const settingsPath = path.join(CLAUDE_DIR, "settings.json");
  const settings = safeReadJson(settingsPath);

  let hasCronJobs = false;
  let pluginNames: string[] = [];
  let hasCustomProxy = false;
  let channelTypes: string[] = [];

  if (settings !== null) {
    // Check crons field
    hasCronJobs =
      "crons" in settings &&
      settings["crons"] !== null &&
      settings["crons"] !== undefined;

    // enabledPlugins keys
    const plugins = settings["enabledPlugins"];
    if (plugins !== null && typeof plugins === "object" && !Array.isArray(plugins)) {
      pluginNames = Object.keys(plugins as Record<string, unknown>);
    }

    // Custom proxy
    hasCustomProxy =
      ("proxy" in settings && settings["proxy"] !== null) ||
      ("fallbackModel" in settings && settings["fallbackModel"] !== null);

    // Channels
    const channelsRaw = settings["channels"];
    if (
      channelsRaw !== null &&
      typeof channelsRaw === "object" &&
      !Array.isArray(channelsRaw)
    ) {
      channelTypes = Object.keys(channelsRaw as Record<string, unknown>);
    }
  }

  // Also check channels directory for channel types
  if (channelTypes.length === 0) {
    const channelsDir = path.join(CLAUDE_DIR, "channels");
    const entries = safeReadDir(channelsDir);
    if (entries.length > 0) {
      channelTypes = entries.filter((e) =>
        isDirectory(path.join(channelsDir, e))
      );
    }
  }

  const hasPlugins = pluginNames.length > 0;
  const hasChannels = channelTypes.length > 0;

  return {
    hasCronJobs,
    hasPlugins,
    pluginNames,
    hasCustomProxy,
    hasChannels,
    channelTypes,
  };
}

export function buildManifest(username: string, github?: string): AgentScoreManifest {
  return {
    version: "1.0",
    exportedAt: new Date().toISOString(),
    generator: "agentscore-cli",
    username,
    ...(github !== undefined ? { github } : {}),
    agents: scanAgents(),
    memory: scanMemory(),
    mcpServers: scanMcpServers(),
    hooks: scanHooks(),
    commands: scanCommands(),
    projects: scanProjects(),
    workflows: scanWorkflows(),
  };
}
