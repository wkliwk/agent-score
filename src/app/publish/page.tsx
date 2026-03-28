"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Trash2,
  Upload,
  AlertCircle,
  Eye,
  ArrowLeft,
  ShieldCheck,
} from "lucide-react";
import Navbar from "@/components/Navbar";

type FileCategory = "agent" | "command" | "memory-index" | "hooks-structure";

interface BundleFile {
  path: string;
  category: FileCategory;
  content: string;
}

interface RedactionDetail {
  file: string;
  secretsFound: number;
  details: { line: number; pattern: string; redactedAs: string }[];
}

const CATEGORY_OPTIONS: { value: FileCategory; label: string }[] = [
  { value: "agent", label: "Agent (.md)" },
  { value: "command", label: "Command (.md)" },
  { value: "memory-index", label: "Memory Index" },
  { value: "hooks-structure", label: "Hooks Structure" },
];

export default function PublishPage() {
  const router = useRouter();
  const [files, setFiles] = useState<BundleFile[]>([
    { path: "", category: "agent", content: "" },
  ]);
  const [description, setDescription] = useState("");
  const [username, setUsername] = useState("");
  const [step, setStep] = useState<"edit" | "preview" | "result">("edit");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [redactions, setRedactions] = useState<RedactionDetail[]>([]);

  const addFile = useCallback(() => {
    setFiles((prev) => [
      ...prev,
      { path: "", category: "agent", content: "" },
    ]);
  }, []);

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const updateFile = useCallback(
    (index: number, updates: Partial<BundleFile>) => {
      setFiles((prev) =>
        prev.map((f, i) => (i === index ? { ...f, ...updates } : f))
      );
    },
    []
  );

  const validFiles = files.filter(
    (f) => f.path.trim() !== "" && f.content.trim() !== ""
  );

  const handlePreview = useCallback(() => {
    setError(null);
    if (!username.trim()) {
      setError("Please enter your GitHub username");
      return;
    }
    if (validFiles.length === 0) {
      setError("Add at least one file with a path and content");
      return;
    }
    setStep("preview");
  }, [username, validFiles]);

  const handleSubmit = useCallback(async () => {
    setError(null);
    setSubmitting(true);
    setRedactions([]);

    try {
      const res = await fetch("/api/bundles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          version: "1.0",
          username: username.trim(),
          description: description.trim() || undefined,
          files: validFiles,
          slices: {
            agents: validFiles
              .filter((f) => f.category === "agent")
              .map((f) => f.path),
            skills: validFiles
              .filter((f) => f.category === "command")
              .map((f) => f.path),
            memoryStructure: validFiles.some(
              (f) => f.category === "memory-index"
            ),
            hooksStructure: validFiles.some(
              (f) => f.category === "hooks-structure"
            ),
          },
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          setError(
            "Authentication required. Please sign in first via CLI: npx agentscore export"
          );
        } else {
          setError(data.error ?? "Failed to publish bundle");
        }
        return;
      }

      if (data.redactions) {
        setRedactions(data.redactions);
      }

      setStep("result");
    } catch {
      setError("Failed to submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }, [username, description, validFiles]);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 px-4 py-10 md:py-14">
        <div className="mx-auto max-w-3xl">
          {step === "edit" && (
            <>
              <h1 className="text-2xl font-bold text-white mb-2">
                Publish Your Setup
              </h1>
              <p className="text-sm text-white/50 mb-8">
                Share your Claude Code agents, commands, and configuration with
                the community. All files are scanned for credentials before
                publishing.
              </p>

              {/* Username */}
              <div className="mb-6">
                <label className="block text-xs uppercase tracking-widest text-white/40 mb-2">
                  GitHub Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="your-github-username"
                  className="w-full max-w-xs rounded-lg bg-[#12121a] border border-white/10 px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-indigo-500/50"
                />
              </div>

              {/* Description */}
              <div className="mb-8">
                <label className="block text-xs uppercase tracking-widest text-white/40 mb-2">
                  Description (optional)
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g., 10-agent autonomous company setup, 3 months of iteration"
                  className="w-full rounded-lg bg-[#12121a] border border-white/10 px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-indigo-500/50"
                />
              </div>

              {/* Files */}
              <div className="space-y-4 mb-6">
                <label className="block text-xs uppercase tracking-widest text-white/40">
                  Files
                </label>
                {files.map((file, i) => (
                  <div
                    key={i}
                    className="rounded-xl bg-[#12121a] border border-white/10 p-4"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <input
                        type="text"
                        value={file.path}
                        onChange={(e) =>
                          updateFile(i, { path: e.target.value })
                        }
                        placeholder="e.g., agents/backend-dev.md"
                        className="flex-1 rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-sm font-mono text-white placeholder:text-white/20 focus:outline-none focus:border-indigo-500/50"
                      />
                      <select
                        value={file.category}
                        onChange={(e) =>
                          updateFile(i, {
                            category: e.target.value as FileCategory,
                          })
                        }
                        className="rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500/50"
                      >
                        {CATEGORY_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      {files.length > 1 && (
                        <button
                          onClick={() => removeFile(i)}
                          className="text-white/30 hover:text-red-400 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                    <textarea
                      value={file.content}
                      onChange={(e) =>
                        updateFile(i, { content: e.target.value })
                      }
                      placeholder="Paste file content here..."
                      className="w-full h-40 rounded-lg bg-black/40 border border-white/10 p-3 font-mono text-xs text-white/80 placeholder:text-white/20 resize-y focus:outline-none focus:border-indigo-500/50"
                    />
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-3 mb-8">
                <button
                  onClick={addFile}
                  className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <Plus size={14} />
                  Add File
                </button>
              </div>

              {error && (
                <div className="flex items-start gap-3 rounded-xl bg-red-500/10 border border-red-500/20 p-4 mb-6">
                  <AlertCircle
                    size={18}
                    className="text-red-400 shrink-0 mt-0.5"
                  />
                  <p className="text-sm text-red-300">{error}</p>
                </div>
              )}

              <button
                onClick={handlePreview}
                disabled={validFiles.length === 0}
                className="inline-flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <Eye size={16} />
                Preview &amp; Publish
              </button>
            </>
          )}

          {step === "preview" && (
            <>
              <button
                onClick={() => setStep("edit")}
                className="inline-flex items-center gap-1.5 text-sm text-white/50 hover:text-white transition-colors mb-6"
              >
                <ArrowLeft size={14} />
                Back to edit
              </button>

              <h1 className="text-2xl font-bold text-white mb-2">
                Preview Your Bundle
              </h1>
              <p className="text-sm text-white/50 mb-6">
                Review the files below. The server will scan for credentials and
                redact any found.
              </p>

              {description && (
                <div className="rounded-xl bg-[#12121a] border border-white/10 p-4 mb-4">
                  <span className="text-xs uppercase tracking-widest text-white/40">
                    Description
                  </span>
                  <p className="text-sm text-white/70 mt-1">{description}</p>
                </div>
              )}

              <div className="space-y-3 mb-8">
                {validFiles.map((file, i) => (
                  <details
                    key={i}
                    className="rounded-xl bg-[#12121a] border border-white/10 overflow-hidden"
                    open
                  >
                    <summary className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-white/[0.02] transition-colors">
                      <span className="flex-1 font-mono text-sm text-white/80">
                        {file.path}
                      </span>
                      <span className="rounded px-2 py-0.5 text-xs bg-white/5 text-white/50">
                        {file.category}
                      </span>
                    </summary>
                    <pre className="border-t border-white/5 p-4 text-xs text-white/70 font-mono whitespace-pre-wrap overflow-x-auto">
                      {file.content}
                    </pre>
                  </details>
                ))}
              </div>

              <div className="flex items-center gap-2 text-xs text-white/40 mb-6">
                <ShieldCheck size={14} />
                Files will be scanned for API keys, tokens, and credentials
                before publishing.
              </div>

              {error && (
                <div className="flex items-start gap-3 rounded-xl bg-red-500/10 border border-red-500/20 p-4 mb-6">
                  <AlertCircle
                    size={18}
                    className="text-red-400 shrink-0 mt-0.5"
                  />
                  <p className="text-sm text-red-300">{error}</p>
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Upload size={16} />
                {submitting ? "Publishing..." : "Publish Setup"}
              </button>
            </>
          )}

          {step === "result" && (
            <div className="text-center py-16">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15 mx-auto mb-6">
                <ShieldCheck size={28} className="text-emerald-400" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">
                Setup Published
              </h1>
              <p className="text-sm text-white/50 mb-6">
                Your setup is now live and viewable by the community.
              </p>

              {redactions.length > 0 && (
                <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-4 mb-6 text-left max-w-lg mx-auto">
                  <h3 className="text-sm font-semibold text-amber-400 mb-2">
                    Credentials Redacted
                  </h3>
                  {redactions.map((r, i) => (
                    <div key={i} className="text-xs text-amber-300/70 mb-1">
                      <span className="font-mono">{r.file}</span> —{" "}
                      {r.secretsFound} secret(s) redacted
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() =>
                    router.push(`/u/${encodeURIComponent(username)}/setup`)
                  }
                  className="inline-flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-500 transition-colors"
                >
                  View Your Setup
                </button>
                <button
                  onClick={() => {
                    setStep("edit");
                    setFiles([
                      { path: "", category: "agent", content: "" },
                    ]);
                    setDescription("");
                    setRedactions([]);
                  }}
                  className="inline-flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm text-white/60 bg-white/5 border border-white/10 hover:text-white hover:bg-white/10 transition-colors"
                >
                  Publish Another
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
