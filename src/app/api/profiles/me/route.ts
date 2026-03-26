import type { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import { auth } from "@/auth";

// ---------------------------------------------------------------------------
// PATCH /api/profiles/me — update visibility for the authenticated user
// ---------------------------------------------------------------------------
export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const githubId = session.user.id;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (typeof body !== "object" || body === null) {
    return Response.json({ error: "Request body must be an object" }, { status: 400 });
  }

  const { visibility } = body as Record<string, unknown>;

  if (visibility !== "public" && visibility !== "unlisted") {
    return Response.json(
      { error: 'visibility must be "public" or "unlisted"' },
      { status: 422 }
    );
  }

  const rows = await db
    .update(profiles)
    .set({ visibility, updatedAt: new Date() })
    .where(eq(profiles.githubId, githubId))
    .returning({
      id: profiles.id,
      githubLogin: profiles.githubLogin,
      visibility: profiles.visibility,
    });

  if (rows.length === 0) {
    return Response.json({ error: "Profile not found" }, { status: 404 });
  }

  return Response.json({ profile: rows[0] });
}
