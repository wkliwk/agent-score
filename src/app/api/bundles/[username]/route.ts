import type { NextRequest } from "next/server";

// In-memory store (shared with parent route via import)
// For MVP, this is a simple reference — in production, both routes would use the DB
// This endpoint returns mock data or stored data

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

// GET /api/bundles/[username] — fetch a user's bundle
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;

  // In production, this would query the DB
  // For MVP, return 404 (bundles are stored in-memory on POST and won't persist across restarts)
  return Response.json(
    { error: `Bundle not found for @${username}` },
    { status: 404 }
  );
}

// POST /api/bundles/[username]/import — record an import (increment counter)
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;

  // In production, increment import counter and record "inspired by"
  return Response.json({
    success: true,
    message: `Import from @${username} recorded`,
  });
}
