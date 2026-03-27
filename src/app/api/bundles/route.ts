import type { NextRequest } from "next/server";
import { auth } from "@/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { redactContent } from "@/lib/credential-scanner";

// In-memory store for MVP (replace with DB table later)
const bundleStore = new Map<string, BundleData>();

interface BundleFile {
  path: string;
  category: "agent" | "command" | "memory-index" | "hooks-structure";
  content: string;
}

interface BundleData {
  version: string;
  createdAt: string;
  username: string;
  files: BundleFile[];
  slices: {
    agents: string[];
    skills: string[];
    memoryStructure: boolean;
    hooksStructure: boolean;
  };
  importCount: number;
  inspiredBy: string[];
}

// POST /api/bundles — publish a bundle
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!checkRateLimit(session.user.id, 5)) {
    return Response.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const bundle = body as {
    version?: string;
    username?: string;
    files?: BundleFile[];
    slices?: { agents?: string[]; skills?: string[]; memoryStructure?: boolean; hooksStructure?: boolean };
  };

  if (!bundle.version || !bundle.username || !Array.isArray(bundle.files)) {
    return Response.json({ error: "Invalid bundle format" }, { status: 400 });
  }

  // Server-side credential scan + redaction
  const redactionReports = [];
  const redactedFiles: BundleFile[] = [];
  for (const file of bundle.files) {
    const report = redactContent(file.content, file.path);
    if (report.results.length > 0) {
      redactionReports.push({
        file: file.path,
        secretsFound: report.results.length,
        details: report.results.map((r) => ({
          line: r.line,
          pattern: r.pattern,
          redactedAs: r.redactedAs,
        })),
      });
    }
    // Always store the redacted version
    redactedFiles.push({ ...file, content: report.redacted });
  }

  const data: BundleData = {
    version: bundle.version,
    createdAt: new Date().toISOString(),
    username: bundle.username,
    files: redactedFiles,
    slices: {
      agents: bundle.slices?.agents ?? [],
      skills: bundle.slices?.skills ?? [],
      memoryStructure: bundle.slices?.memoryStructure ?? false,
      hooksStructure: bundle.slices?.hooksStructure ?? false,
    },
    importCount: 0,
    inspiredBy: [],
  };

  bundleStore.set(bundle.username.toLowerCase(), data);

  return Response.json({
    success: true,
    username: bundle.username,
    redactions: redactionReports.length > 0 ? redactionReports : undefined,
  });
}

// GET /api/bundles — list all bundles
export async function GET() {
  const bundles = Array.from(bundleStore.values()).map((b) => ({
    username: b.username,
    fileCount: b.files.length,
    agentCount: b.slices.agents.length,
    skillCount: b.slices.skills.length,
    importCount: b.importCount,
    createdAt: b.createdAt,
  }));

  return Response.json({ bundles });
}
