import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowLeft,
  Download,
  FileCode2,
  Terminal,
  BookOpen,
  Settings,
  GitFork,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import ImportButton from "./ImportButton";

interface SetupPageProps {
  params: Promise<{ username: string }>;
}

interface BundleFile {
  path: string;
  category: "agent" | "command" | "memory-index" | "hooks-structure";
  content: string;
}

interface BundleData {
  username: string;
  description: string | null;
  files: BundleFile[];
  slices: {
    agents?: string[];
    skills?: string[];
    memoryStructure?: boolean;
    hooksStructure?: boolean;
  };
  importCount: number;
  createdAt: string;
}

const CATEGORY_META: Record<
  string,
  { label: string; icon: typeof FileCode2; color: string }
> = {
  agent: { label: "Agent", icon: Terminal, color: "#8b5cf6" },
  command: { label: "Command", icon: BookOpen, color: "#3b82f6" },
  "memory-index": { label: "Memory Index", icon: FileCode2, color: "#10b981" },
  "hooks-structure": { label: "Hooks", icon: Settings, color: "#f59e0b" },
};

async function fetchBundle(username: string): Promise<BundleData | null> {
  try {
    const { getDb } = await import("@/db");
    const { bundles } = await import("@/db/schema");
    const { eq } = await import("drizzle-orm");
    const db = getDb();

    const rows = await db
      .select()
      .from(bundles)
      .where(eq(bundles.username, username.toLowerCase()))
      .limit(1);

    if (rows.length === 0) return null;

    const row = rows[0];
    return {
      username: row.username,
      description: row.description,
      files: row.files as BundleFile[],
      slices: row.slices as BundleData["slices"],
      importCount: row.importCount,
      createdAt: row.createdAt.toISOString(),
    };
  } catch {
    return null;
  }
}

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://agentscore.dev";

export async function generateMetadata({
  params,
}: SetupPageProps): Promise<Metadata> {
  const { username } = await params;
  const bundle = await fetchBundle(username);
  if (!bundle) return { title: "Setup not found" };

  const title = `@${username}'s Claude Code Setup — AgentScore`;
  const description =
    bundle.description ??
    `${bundle.files.length} files shared by @${username}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/u/${username}/setup`,
    },
  };
}

export default async function SetupPage({ params }: SetupPageProps) {
  const { username } = await params;
  const bundle = await fetchBundle(username);

  if (!bundle) {
    notFound();
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1 px-4 py-10 md:py-14">
        <div className="mx-auto max-w-4xl">
          {/* Back link */}
          <Link
            href={`/u/${username}`}
            className="inline-flex items-center gap-1.5 text-sm text-white/50 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft size={14} />
            Back to @{username}&apos;s profile
          </Link>

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-bold text-white">
                @{username}&apos;s Setup
              </h1>
              {bundle.description && (
                <p className="mt-2 text-sm text-white/55 max-w-xl">
                  {bundle.description}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <div className="flex items-center gap-1.5 text-sm text-white/50">
                <GitFork size={14} className="text-indigo-400" />
                <span className="font-mono text-white/70">
                  {bundle.importCount}
                </span>
                <span>imports</span>
              </div>
              <ImportButton username={username} />
            </div>
          </div>

          {/* Stats bar */}
          <div className="flex flex-wrap gap-2 mb-8">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 border border-white/10 px-3 py-1 text-xs text-white/60">
              <FileCode2 size={12} />
              {bundle.files.length} files
            </span>
            {(bundle.slices.agents?.length ?? 0) > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 px-3 py-1 text-xs text-purple-400">
                <Terminal size={12} />
                {bundle.slices.agents!.length} agents
              </span>
            )}
            {(bundle.slices.skills?.length ?? 0) > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 px-3 py-1 text-xs text-blue-400">
                <BookOpen size={12} />
                {bundle.slices.skills!.length} commands
              </span>
            )}
          </div>

          {/* Files */}
          <div className="space-y-4">
            {bundle.files.map((file, i) => {
              const meta = CATEGORY_META[file.category] ?? {
                label: file.category,
                icon: FileCode2,
                color: "#6b7280",
              };
              const Icon = meta.icon;

              return (
                <details
                  key={i}
                  className="group rounded-xl bg-[#12121a] border border-white/10 overflow-hidden"
                  open={i === 0}
                >
                  <summary className="flex items-center gap-3 px-5 py-4 cursor-pointer hover:bg-white/[0.02] transition-colors select-none">
                    <Icon
                      size={16}
                      className="shrink-0"
                      style={{ color: meta.color }}
                    />
                    <span className="flex-1 font-mono text-sm text-white/80 truncate">
                      {file.path}
                    </span>
                    <span
                      className="rounded px-2 py-0.5 text-xs font-medium"
                      style={{
                        backgroundColor: `${meta.color}18`,
                        color: meta.color,
                      }}
                    >
                      {meta.label}
                    </span>
                    <svg
                      className="h-4 w-4 text-white/30 transition-transform group-open:rotate-90"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </summary>
                  <div className="border-t border-white/5">
                    <pre className="p-5 overflow-x-auto text-xs leading-relaxed text-white/70 font-mono whitespace-pre-wrap">
                      {file.content}
                    </pre>
                  </div>
                </details>
              );
            })}
          </div>

          {/* Scanned badge */}
          <div className="mt-8 text-center">
            <span className="inline-flex items-center gap-1.5 text-xs text-white/30">
              <svg
                className="h-3 w-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
              Scanned by AgentScore — credentials redacted
            </span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 px-4 py-6">
        <div className="mx-auto max-w-7xl text-center text-xs text-white/30">
          AgentScore — Built by{" "}
          <a
            href="https://github.com/wkliwk"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white/60 transition-colors"
          >
            @wkliwk
          </a>
        </div>
      </footer>
    </div>
  );
}
