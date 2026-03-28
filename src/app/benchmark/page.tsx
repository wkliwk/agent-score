"use client";

import { useState, useCallback } from "react";
import {
  ClipboardCheck,
  Copy,
  Check,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Play,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import type { BenchmarkResult } from "@/lib/benchmark/types";

interface TaskDef {
  id: string;
  title: string;
  description: string;
  prompt: string;
  outputTemplate: string;
  checkCount: number;
  checks: { id: string; description: string }[];
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* */
    }
  };
  return (
    <button
      onClick={handleCopy}
      className="text-white/30 hover:text-white transition-colors"
      title="Copy to clipboard"
    >
      {copied ? (
        <Check size={14} className="text-emerald-400" />
      ) : (
        <Copy size={14} />
      )}
    </button>
  );
}

export default function BenchmarkPage() {
  const [tasks, setTasks] = useState<TaskDef[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [username, setUsername] = useState("");
  const [outputs, setOutputs] = useState<Record<string, string>>({});
  const [result, setResult] = useState<BenchmarkResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [grading, setGrading] = useState(false);
  const [expandedTask, setExpandedTask] = useState<string | null>(null);

  const loadTasks = useCallback(async () => {
    try {
      const res = await fetch("/api/benchmarks/grade");
      const data = await res.json();
      setTasks(data.tasks);
      setLoaded(true);
      // Initialize outputs
      const init: Record<string, string> = {};
      for (const t of data.tasks) {
        init[t.id] = t.outputTemplate;
      }
      setOutputs(init);
    } catch {
      setError("Failed to load benchmark tasks");
    }
  }, []);

  const handleGrade = useCallback(async () => {
    setError(null);
    setResult(null);

    if (!username.trim()) {
      setError("Please enter your GitHub username");
      return;
    }

    // Parse each output as JSON
    const submissions: Record<string, Record<string, string>> = {};
    for (const task of tasks) {
      const raw = outputs[task.id];
      if (!raw || raw === task.outputTemplate) continue;
      try {
        submissions[task.id] = JSON.parse(raw);
      } catch {
        setError(`Invalid JSON in "${task.title}" output. Please check the format.`);
        return;
      }
    }

    if (Object.keys(submissions).length === 0) {
      setError("Please fill in at least one task output before grading.");
      return;
    }

    setGrading(true);
    try {
      const res = await fetch("/api/benchmarks/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), submissions }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Grading failed");
        return;
      }
      setResult(data);
    } catch {
      setError("Failed to submit for grading");
    } finally {
      setGrading(false);
    }
  }, [username, tasks, outputs]);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 px-4 py-10 md:py-14">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-center gap-3 mb-2">
            <ClipboardCheck size={24} className="text-cyan-400" />
            <h1 className="text-2xl font-bold text-white">
              Benchmark Your Setup
            </h1>
          </div>
          <p className="text-sm text-white/50 mb-8">
            Run standardized tasks in your Claude Code session, paste the
            structured output here, and get graded instantly. No AI
            grading — all checks are deterministic.
          </p>

          {/* How it works */}
          <div className="rounded-xl bg-[#12121a] border border-cyan-500/20 p-5 mb-8">
            <h2 className="text-xs uppercase tracking-widest text-cyan-400 mb-3">
              How it works
            </h2>
            <ol className="space-y-2 text-sm text-white/60">
              <li className="flex items-start gap-2">
                <span className="font-mono text-cyan-400 shrink-0">1.</span>
                Load the tasks below and copy each prompt into your Claude Code
                session
              </li>
              <li className="flex items-start gap-2">
                <span className="font-mono text-cyan-400 shrink-0">2.</span>
                After CC completes each task, fill in the output template with
                what happened
              </li>
              <li className="flex items-start gap-2">
                <span className="font-mono text-cyan-400 shrink-0">3.</span>
                Click &quot;Grade My Results&quot; to see your benchmark score
              </li>
            </ol>
          </div>

          {!loaded ? (
            <button
              onClick={loadTasks}
              className="flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-medium bg-cyan-600 text-white hover:bg-cyan-500 transition-colors"
            >
              <Play size={16} />
              Load Benchmark Tasks
            </button>
          ) : (
            <>
              {/* Username input */}
              <div className="mb-8">
                <label className="block text-xs uppercase tracking-widest text-white/40 mb-2">
                  GitHub Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="your-github-username"
                  className="w-full max-w-xs rounded-lg bg-[#12121a] border border-white/10 px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-cyan-500/50"
                />
              </div>

              {/* Tasks */}
              <div className="space-y-4 mb-8">
                {tasks.map((task, i) => {
                  const isExpanded = expandedTask === task.id;
                  const taskResult = result?.tasks.find(
                    (t) => t.taskId === task.id
                  );
                  return (
                    <div
                      key={task.id}
                      className="rounded-xl bg-[#12121a] border border-white/10 overflow-hidden"
                    >
                      {/* Task header */}
                      <button
                        onClick={() =>
                          setExpandedTask(isExpanded ? null : task.id)
                        }
                        className="w-full flex items-center gap-3 p-4 text-left hover:bg-white/[0.02] transition-colors"
                      >
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-cyan-500/15 text-xs font-bold text-cyan-400">
                          {i + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-white text-sm">
                              {task.title}
                            </span>
                            {taskResult && (
                              <span
                                className={`rounded px-1.5 py-0.5 text-xs font-mono ${
                                  taskResult.passed
                                    ? "bg-emerald-500/10 text-emerald-400"
                                    : "bg-red-500/10 text-red-400"
                                }`}
                              >
                                {taskResult.passed ? "PASS" : "FAIL"}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-white/40 truncate">
                            {task.description}
                          </p>
                        </div>
                        <ChevronRight
                          size={16}
                          className={`text-white/30 transition-transform ${
                            isExpanded ? "rotate-90" : ""
                          }`}
                        />
                      </button>

                      {/* Expanded content */}
                      {isExpanded && (
                        <div className="border-t border-white/5 p-4 space-y-4">
                          {/* Prompt */}
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs uppercase tracking-widest text-white/40">
                                Prompt (copy into CC)
                              </span>
                              <CopyButton text={task.prompt} />
                            </div>
                            <pre className="rounded-lg bg-black/40 p-3 text-xs text-white/70 whitespace-pre-wrap font-mono">
                              {task.prompt}
                            </pre>
                          </div>

                          {/* Rubric checks */}
                          <div>
                            <span className="text-xs uppercase tracking-widest text-white/40 mb-2 block">
                              Grading Criteria
                            </span>
                            <ul className="space-y-1">
                              {task.checks.map((c) => {
                                const cr = taskResult?.checks.find(
                                  (ch) => ch.checkId === c.id
                                );
                                return (
                                  <li
                                    key={c.id}
                                    className="flex items-center gap-2 text-xs"
                                  >
                                    {cr ? (
                                      cr.passed ? (
                                        <CheckCircle2
                                          size={13}
                                          className="shrink-0 text-emerald-500"
                                        />
                                      ) : (
                                        <XCircle
                                          size={13}
                                          className="shrink-0 text-red-400"
                                        />
                                      )
                                    ) : (
                                      <span className="h-3.5 w-3.5 shrink-0 rounded-full border border-white/20" />
                                    )}
                                    <span
                                      className={
                                        cr
                                          ? cr.passed
                                            ? "text-white/70"
                                            : "text-red-300"
                                          : "text-white/50"
                                      }
                                    >
                                      {c.description}
                                    </span>
                                    {cr && !cr.passed && cr.reason && (
                                      <span className="text-red-400/60 ml-1">
                                        — {cr.reason}
                                      </span>
                                    )}
                                  </li>
                                );
                              })}
                            </ul>
                          </div>

                          {/* Output template */}
                          <div>
                            <span className="text-xs uppercase tracking-widest text-white/40 mb-2 block">
                              Your Output (fill in after running)
                            </span>
                            <textarea
                              value={outputs[task.id] ?? ""}
                              onChange={(e) =>
                                setOutputs((prev) => ({
                                  ...prev,
                                  [task.id]: e.target.value,
                                }))
                              }
                              className="w-full h-32 rounded-lg bg-black/40 border border-white/10 p-3 font-mono text-xs text-white/80 placeholder:text-white/20 resize-y focus:outline-none focus:border-cyan-500/50"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Grade button */}
              <button
                onClick={handleGrade}
                disabled={grading}
                className="flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-medium bg-cyan-600 text-white hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mb-8"
              >
                <ClipboardCheck size={16} />
                {grading ? "Grading..." : "Grade My Results"}
              </button>

              {/* Error */}
              {error && (
                <div className="flex items-start gap-3 rounded-xl bg-red-500/10 border border-red-500/20 p-4 mb-8">
                  <AlertCircle
                    size={18}
                    className="text-red-400 shrink-0 mt-0.5"
                  />
                  <p className="text-sm text-red-300">{error}</p>
                </div>
              )}

              {/* Results */}
              {result && (
                <div className="rounded-xl bg-[#12121a] border border-white/10 p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <ClipboardCheck size={20} className="text-cyan-400" />
                    <h2 className="text-lg font-semibold text-white">
                      Benchmark Results
                    </h2>
                  </div>

                  {/* Score */}
                  <div className="text-center mb-6">
                    <div
                      className={`text-5xl font-bold ${
                        result.score >= 80
                          ? "text-emerald-400"
                          : result.score >= 50
                            ? "text-amber-400"
                            : "text-red-400"
                      }`}
                    >
                      {result.score}%
                    </div>
                    <p className="text-sm text-white/40 mt-1">
                      {result.passedTasks} of {result.totalTasks} tasks passed
                    </p>
                  </div>

                  {/* Per-task results */}
                  <div className="space-y-2">
                    {result.tasks.map((tr) => {
                      const task = tasks.find((t) => t.id === tr.taskId);
                      return (
                        <div
                          key={tr.taskId}
                          className="flex items-center gap-3 rounded-lg bg-white/[0.02] p-3"
                        >
                          {tr.passed ? (
                            <CheckCircle2
                              size={16}
                              className="text-emerald-500 shrink-0"
                            />
                          ) : (
                            <XCircle
                              size={16}
                              className="text-red-400 shrink-0"
                            />
                          )}
                          <span className="flex-1 text-sm text-white/70">
                            {task?.title ?? tr.taskId}
                          </span>
                          <span
                            className={`text-xs font-mono ${
                              tr.passed ? "text-emerald-400" : "text-red-400"
                            }`}
                          >
                            {tr.checks.filter((c) => c.passed).length}/
                            {tr.checks.length}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <p className="text-xs text-white/30 text-center mt-6">
                    Benchmark score is separate from your AgentScore config
                    score.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
