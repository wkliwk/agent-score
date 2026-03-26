import { auth } from "@/auth";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import { eq } from "drizzle-orm";

export interface SessionUser {
  id: string;
  githubId: string;
  githubLogin: string;
  displayName: string;
  avatarUrl: string | null;
}

/**
 * Returns the current NextAuth session user, or null if unauthenticated.
 * The `id` on session.user is the GitHub OAuth sub (numeric string).
 */
export async function getCurrentSession(): Promise<SessionUser | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  return {
    id: session.user.id,
    githubId: session.user.id,
    githubLogin: session.user.name ?? "",
    displayName: session.user.name ?? "",
    avatarUrl: session.user.image ?? null,
  };
}

/**
 * Returns the profiles row for the authenticated user, or null.
 * Uses the GitHub ID from the NextAuth session to look up the DB record.
 */
export async function getCurrentProfile() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const rows = await db
    .select()
    .from(profiles)
    .where(eq(profiles.githubId, session.user.id))
    .limit(1);

  return rows[0] ?? null;
}
