import type { NextRequest } from "next/server";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { bundles } from "@/db/schema";

// GET /api/bundles/[username] — fetch a user's bundle
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;

  const rows = await db
    .select()
    .from(bundles)
    .where(eq(bundles.username, username.toLowerCase()))
    .limit(1);

  if (rows.length === 0) {
    return Response.json(
      { error: `Bundle not found for @${username}` },
      { status: 404 }
    );
  }

  const row = rows[0];
  const files = row.files as {
    path: string;
    category: string;
    content: string;
  }[];

  return Response.json({
    username: row.username,
    description: row.description,
    files,
    slices: row.slices,
    importCount: row.importCount,
    createdAt: row.createdAt.toISOString(),
  });
}

// POST /api/bundles/[username]/import — record an import (increment counter)
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;

  const result = await db
    .update(bundles)
    .set({
      importCount: sql`${bundles.importCount} + 1`,
    })
    .where(eq(bundles.username, username.toLowerCase()))
    .returning({ importCount: bundles.importCount });

  if (result.length === 0) {
    return Response.json(
      { error: `Bundle not found for @${username}` },
      { status: 404 }
    );
  }

  return Response.json({
    success: true,
    importCount: result[0].importCount,
  });
}
