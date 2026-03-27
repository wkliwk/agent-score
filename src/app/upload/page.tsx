"use client";

import { useState, useCallback } from "react";
import { Upload, FileJson, AlertCircle, CheckCircle2, Copy, Check } from "lucide-react";
import Navbar from "@/components/Navbar";

interface ScorePreview {
  composite: number;
  tier: string;
  dimensions: { label: string; score: number }[];
}

function validateManifest(json: unknown): string | null {
  if (typeof json !== "object" || json === null) return "Invalid JSON: expected an object";
  const m = json as Record<string, unknown>;
  if (m["version"] !== "1.0") return "Missing or invalid 'version' field (expected '1.0')";
  if (typeof m["username"] !== "string" || m["username"] === "") return "Missing 'username' field";
  const requiredSections = ["agents", "memory", "mcpServers", "hooks", "commands", "projects", "workflows"];
  for (const key of requiredSections) {
    if (typeof m[key] !== "object" || m[key] === null) return `Missing '${key}' section`;
  }
  return null;
}

function quickScore(json: Record<string, unknown>): ScorePreview {
  const m = json as {
    agents: { count: number; names: string[]; hasSharedDir: boolean };
    memory: { hasMemoryMd: boolean; memoryFileCount: number; memoryCategories: string[]; projectMemoryDirs: number };
    mcpServers: { count: number; names: string[] };
    hooks: { events: string[]; totalHookCount: number; hasStatusLine: boolean };
    commands: { count: number; names: string[] };
    workflows: { hasCronJobs: boolean; hasPlugins: boolean; pluginNames: string[]; hasCustomProxy: boolean; hasChannels: boolean; channelTypes: string[] };
  };

  const cap = (v: number, max: number) => Math.min(v, max);

  let auto = 0;
  if (m.hooks.totalHookCount > 0) auto += 2;
  if (m.hooks.events.includes("UserPromptSubmit")) auto += 1;
  if (m.hooks.events.includes("PreToolUse")) auto += 1;
  if (m.hooks.events.includes("Stop")) auto += 1;
  if (m.hooks.totalHookCount >= 3) auto += 1;
  if (m.hooks.totalHookCount >= 6) auto += 1;
  if (m.hooks.hasStatusLine) auto += 1;
  if (m.workflows.hasCronJobs) auto += 1;
  if (m.workflows.hasCustomProxy) auto += 1;

  let mem = 0;
  if (m.memory.hasMemoryMd) mem += 2;
  if (m.memory.memoryFileCount >= 3) mem += 1;
  if (m.memory.memoryFileCount >= 6) mem += 1;
  if (m.memory.memoryFileCount >= 10) mem += 1;
  if (m.memory.memoryCategories.length >= 2) mem += 1;
  if (m.memory.memoryCategories.length >= 4) mem += 1;
  if (m.memory.projectMemoryDirs >= 1) mem += 1;
  if (m.memory.projectMemoryDirs >= 3) mem += 1;
  if (m.memory.projectMemoryDirs >= 5) mem += 1;

  let agent = 0;
  if (m.agents.count > 0) agent += 2;
  if (m.agents.count >= 3) agent += 1;
  if (m.agents.count >= 5) agent += 1;
  if (m.agents.count >= 8) agent += 1;
  if (m.agents.count >= 10) agent += 1;
  if (m.agents.hasSharedDir) agent += 1;

  let tool = 0;
  if (m.mcpServers.count > 0) tool += 2;
  if (m.mcpServers.count >= 2) tool += 1;
  if (m.mcpServers.count >= 4) tool += 1;
  if (m.mcpServers.count >= 6) tool += 1;
  if (m.mcpServers.count >= 8) tool += 1;

  let skill = 0;
  if (m.commands.count > 0) skill += 2;
  if (m.commands.count >= 3) skill += 1;
  if (m.commands.count >= 5) skill += 1;
  if (m.commands.count >= 8) skill += 1;
  if (m.commands.count >= 12) skill += 1;
  if (m.commands.count >= 16) skill += 1;
  if (m.commands.count >= 20) skill += 1;

  let wf = 0;
  if (m.workflows.hasPlugins) wf += 1;
  if (m.workflows.pluginNames.length >= 2) wf += 1;
  if (m.workflows.hasChannels) wf += 1;
  if (m.hooks.totalHookCount > 0 && m.commands.count > 0) wf += 1;
  if (m.agents.count > 0 && m.commands.count > 0) wf += 1;
  if (m.mcpServers.count > 0 && m.hooks.totalHookCount > 0) wf += 1;
  if (m.agents.count > 0 && m.mcpServers.count > 0 && m.hooks.totalHookCount > 0 && m.commands.count > 0) wf += 2;
  if (m.memory.projectMemoryDirs >= 3) wf += 1;

  const dims = [
    { label: "Automation", score: cap(auto, 10) },
    { label: "Memory", score: cap(mem, 10) },
    { label: "Agent Coverage", score: cap(agent, 10) },
    { label: "Tool Integrations", score: cap(tool, 10) },
    { label: "Skill Breadth", score: cap(skill, 10) },
    { label: "Workflow Depth", score: cap(wf, 10) },
  ];

  const sum = dims.reduce((s, d) => s + d.score, 0);
  const composite = Math.round((sum / 6) * 10) / 10;

  let tier = "Beginner";
  if (composite > 8) tier = "Master";
  else if (composite > 6) tier = "Expert";
  else if (composite > 4) tier = "Advanced";
  else if (composite > 2) tier = "Intermediate";

  return { composite, tier, dimensions: dims };
}

const DIM_COLORS = ["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#f43f5e", "#06b6d4"];

export default function UploadPage() {
  const [jsonText, setJsonText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<ScorePreview | null>(null);
  const [copied, setCopied] = useState(false);

  const handleScore = useCallback(() => {
    setError(null);
    setPreview(null);

    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonText);
    } catch {
      setError("Invalid JSON. Please check your manifest format.");
      return;
    }

    const validationError = validateManifest(parsed);
    if (validationError !== null) {
      setError(validationError);
      return;
    }

    setPreview(quickScore(parsed as Record<string, unknown>));
  }, [jsonText]);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result;
      if (typeof text === "string") {
        setJsonText(text);
        setError(null);
        setPreview(null);
      }
    };
    reader.readAsText(file);
  }, []);

  const handleCopyCommand = async () => {
    try {
      await navigator.clipboard.writeText("npx agentscore export");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* */ }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 px-4 py-10 md:py-14">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-2xl font-bold text-white mb-2">Upload Manifest</h1>
          <p className="text-sm text-white/50 mb-8">
            Paste your AgentScore manifest JSON or upload a file to get your score instantly.
          </p>

          {/* Quick start */}
          <div className="rounded-xl bg-[#12121a] border border-indigo-500/20 p-5 mb-8">
            <h2 className="text-xs uppercase tracking-widest text-indigo-400 mb-3">
              Recommended: Use the CLI
            </h2>
            <p className="text-sm text-white/60 mb-3">
              The fastest way to get your score — one command, 30 seconds:
            </p>
            <div className="flex items-center gap-2 rounded-lg bg-black/40 px-4 py-3 font-mono text-sm">
              <span className="text-emerald-400">$</span>
              <span className="flex-1 text-white">npx agentscore export</span>
              <button
                onClick={handleCopyCommand}
                className="text-white/40 hover:text-white transition-colors"
              >
                {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              </button>
            </div>
            <p className="text-xs text-white/30 mt-2">
              Or save first: <code className="text-white/50">npx agentscore export --save</code>
            </p>
          </div>

          {/* Upload area */}
          <div className="space-y-4 mb-8">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer">
                <FileJson size={16} />
                <span>Upload JSON file</span>
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
              <span className="text-xs text-white/30">or paste below</span>
            </div>

            <textarea
              value={jsonText}
              onChange={(e) => {
                setJsonText(e.target.value);
                setError(null);
                setPreview(null);
              }}
              placeholder='{"version": "1.0", "username": "...", ...}'
              className="w-full h-64 rounded-xl bg-[#12121a] border border-white/10 p-4 font-mono text-sm text-white/80 placeholder:text-white/20 resize-y focus:outline-none focus:border-indigo-500/50"
            />

            <button
              onClick={handleScore}
              disabled={jsonText.trim() === ""}
              className="flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <Upload size={16} />
              Score My Manifest
            </button>
          </div>

          {/* Error */}
          {error !== null && (
            <div className="flex items-start gap-3 rounded-xl bg-red-500/10 border border-red-500/20 p-4 mb-8">
              <AlertCircle size={18} className="text-red-400 shrink-0 mt-0.5" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          {/* Score preview */}
          {preview !== null && (
            <div className="rounded-xl bg-[#12121a] border border-white/10 p-6">
              <div className="flex items-center gap-3 mb-6">
                <CheckCircle2 size={20} className="text-emerald-500" />
                <h2 className="text-lg font-semibold text-white">Score Preview</h2>
              </div>

              <div className="text-center mb-6">
                <div className="text-5xl font-bold text-white">{preview.composite}</div>
                <div className="text-sm text-white/40 mt-1">{preview.tier}</div>
              </div>

              <div className="space-y-3">
                {preview.dimensions.map((d, i) => (
                  <div key={d.label} className="flex items-center gap-3">
                    <span className="text-xs text-white/50 w-32 text-right">{d.label}</span>
                    <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${(d.score / 10) * 100}%`,
                          backgroundColor: DIM_COLORS[i],
                        }}
                      />
                    </div>
                    <span className="text-xs font-mono text-white/60 w-8">{d.score}/10</span>
                  </div>
                ))}
              </div>

              <p className="text-xs text-white/30 text-center mt-6">
                This is a preview. Submit via CLI for your full profile with radar chart and report.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
