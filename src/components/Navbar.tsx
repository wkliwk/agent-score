import Link from "next/link";
import Image from "next/image";
import { auth, signOut } from "@/auth";
import { Button } from "@/components/ui/button";

async function getGithubLogin(githubId: string): Promise<string | null> {
  try {
    const { getDb } = await import("@/db");
    const { profiles } = await import("@/db/schema");
    const { eq } = await import("drizzle-orm");
    const db = getDb();
    const rows = await db
      .select({ githubLogin: profiles.githubLogin })
      .from(profiles)
      .where(eq(profiles.githubId, githubId))
      .limit(1);
    return rows[0]?.githubLogin ?? null;
  } catch {
    return null;
  }
}

export default async function Navbar() {
  const session = await auth();
  const isSignedIn = !!session?.user?.id;
  const githubLogin = isSignedIn
    ? await getGithubLogin(session!.user!.id!)
    : null;
  const avatarUrl = session?.user?.image ?? null;

  return (
    <header className="sticky top-0 z-50 h-16 border-b border-white/10 bg-[#0a0a0f]/80 backdrop-blur-sm">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4 md:px-8">
        <Link href="/" className="flex items-center gap-1 font-bold text-lg tracking-tight">
          <span className="text-white">Agent</span>
          <span className="text-indigo-400">Score</span>
        </Link>

        <nav className="flex items-center gap-2 md:gap-4">
          <Link
            href="/explore"
            className="text-sm text-white/70 hover:text-white transition-colors hidden sm:inline"
          >
            Explore
          </Link>
          <Link
            href="/benchmark"
            className="text-sm text-white/70 hover:text-white transition-colors hidden sm:inline"
          >
            Benchmark
          </Link>
          <Link
            href="/publish"
            className="text-sm text-white/70 hover:text-white transition-colors hidden sm:inline"
          >
            Publish
          </Link>
          <Link
            href="https://github.com/wkliwk/agent-score"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-white/70 hover:text-white transition-colors hidden sm:inline"
          >
            GitHub
          </Link>

          {isSignedIn ? (
            <div className="flex items-center gap-3">
              <Link
                href={githubLogin ? `/u/${githubLogin}` : "/upload"}
                className="flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors"
              >
                {avatarUrl && (
                  <Image
                    src={avatarUrl}
                    alt=""
                    width={28}
                    height={28}
                    className="rounded-full"
                    unoptimized
                  />
                )}
                {githubLogin && (
                  <span className="hidden sm:inline font-mono text-xs">
                    @{githubLogin}
                  </span>
                )}
              </Link>
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/" });
                }}
              >
                <button
                  type="submit"
                  className="text-xs text-white/40 hover:text-white/70 transition-colors"
                >
                  Sign out
                </button>
              </form>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              render={<Link href="/upload" />}
              className="border-white/20 text-white hover:bg-white/10 hover:text-white"
            >
              Sign In
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
