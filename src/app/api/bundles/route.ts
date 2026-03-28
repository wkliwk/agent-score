import type { NextRequest } from "next/server";
import { eq, desc } from "drizzle-orm";
import { db } from "@/db";
import { bundles, profiles } from "@/db/schema";
import { auth } from "@/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { redactContent } from "@/lib/credential-scanner";

interface BundleFile {
  path: string;
  category: "agent" | "command" | "memory-index" | "hooks-structure";
  content: string;
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
    description?: string;
    slices?: {
      agents?: string[];
      skills?: string[];
      memoryStructure?: boolean;
      hooksStructure?: boolean;
    };
  };

  if (!bundle.version || !bundle.username || !Array.isArray(bundle.files)) {
    return Response.json({ error: "Invalid bundle format" }, { status: 400 });
  }

  // Find the profile for this user
  const profileRows = await db
    .select({ id: profiles.id })
    .from(profiles)
    .where(eq(profiles.githubId, session.user.id))
    .limit(1);

  if (profileRows.length === 0) {
    return Response.json(
      { error: "Profile not found. Submit a manifest first." },
      { status: 404 }
    );
  }

  const profileId = profileRows[0].id;

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
    redactedFiles.push({ ...file, content: report.redacted });
  }

  const slicesData = {
    agents: bundle.slices?.agents ?? [],
    skills: bundle.slices?.skills ?? [],
    memoryStructure: bundle.slices?.memoryStructure ?? false,
    hooksStructure: bundle.slices?.hooksStructure ?? false,
  };

  const now = new Date();
  const username = bundle.username.toLowerCase();

  // Upsert: one bundle per username
  const existing = await db
    .select({ id: bundles.id })
    .from(bundles)
    .where(eq(bundles.username, username))
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(bundles)
      .set({
        files: redactedFiles as unknown as Record<string, unknown>,
        slices: slicesData as unknown as Record<string, unknown>,
        description: bundle.description ?? null,
        updatedAt: now,
      })
      .where(eq(bundles.username, username));
  } else {
    await db.insert(bundles).values({
      profileId,
      username,
      description: bundle.description ?? null,
      files: redactedFiles as unknown as Record<string, unknown>,
      slices: slicesData as unknown as Record<string, unknown>,
      importCount: 0,
      inspiredBy: [],
    });
  }

  return Response.json({
    success: true,
    username: bundle.username,
    redactions: redactionReports.length > 0 ? redactionReports : undefined,
  });
}

// GET /api/bundles — list all bundles
export async function GET() {
  const rows = await db
    .select({
      username: bundles.username,
      description: bundles.description,
      files: bundles.files,
      slices: bundles.slices,
      importCount: bundles.importCount,
      createdAt: bundles.createdAt,
    })
    .from(bundles)
    .orderBy(desc(bundles.importCount))
    .limit(50);

  const result = rows.map((row) => {
    const files = row.files as { path: string }[];
    const slices = row.slices as {
      agents?: string[];
      skills?: string[];
    };
    return {
      username: row.username,
      description: row.description,
      fileCount: Array.isArray(files) ? files.length : 0,
      agentCount: slices?.agents?.length ?? 0,
      skillCount: slices?.skills?.length ?? 0,
      importCount: row.importCount,
      createdAt: row.createdAt.toISOString(),
    };
  });

  return Response.json({ bundles: result });
}
