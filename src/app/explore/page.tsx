import Link from "next/link";
import { Terminal } from "lucide-react";
import Navbar from "@/components/Navbar";
import ProfileCard from "@/components/ProfileCard";
import ExploreFilters from "@/components/ExploreFilters";
import { MOCK_PROFILES } from "@/lib/mock-profiles";
import type { MockProfile } from "@/lib/mock-profiles";
interface ExplorePageProps {
  searchParams: Promise<{
    sort?: string;
    dimension?: string;
    page?: string;
  }>;
}

const PAGE_SIZE = 6;

function filterAndSort(
  profiles: MockProfile[],
  sort: string,
  dimension: string | undefined
): MockProfile[] {
  let result = [...profiles];

  if (dimension && dimension !== "all") {
    result = result.filter((p) => {
      const top = [...p.dimensions].sort((a, b) => b.score - a.score)[0];
      return top?.dimension === dimension;
    });
  }

  if (sort === "score") {
    result.sort((a, b) => b.composite - a.composite);
  } else {
    // "newest" — keep mock insertion order as-is (already ordered)
  }

  return result;
}

export default async function ExplorePage({ searchParams }: ExplorePageProps) {
  const params = await searchParams;
  const sort = params.sort === "score" ? "score" : "newest";
  const dimension = params.dimension ?? "all";
  const page = Math.max(1, parseInt(params.page ?? "1", 10));

  // Attempt real API fetch; fall back to mock data if DB not available
  let profiles: MockProfile[] = [];
  let usedMock = false;

  try {
    // In a real setup, we'd fetch from /api/profiles here.
    // For dev without a DB, we always use mock data.
    throw new Error("dev");
  } catch {
    usedMock = true;
    profiles = filterAndSort(MOCK_PROFILES, sort, dimension);
  }

  const totalPages = Math.ceil(profiles.length / PAGE_SIZE);
  const paginated = profiles.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1 px-4 py-10 md:py-14">
        <div className="mx-auto max-w-6xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-white">
              Explore Setups
            </h1>
            <p className="mt-2 text-white/55 text-sm">
              Browse Claude Code ecosystems from the community.
              {usedMock && (
                <span className="ml-2 text-amber-400/70 text-xs">
                  (showing mock data — DB not connected)
                </span>
              )}
            </p>
          </div>

          {/* Filters */}
          <ExploreFilters sort={sort} dimension={dimension} />

          {/* Grid */}
          {paginated.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/5 mb-4">
                <Terminal size={24} className="text-white/40" />
              </div>
              <h2 className="text-lg font-semibold text-white">
                Be the first to share your setup
              </h2>
              <p className="mt-2 text-sm text-white/50 max-w-xs">
                Run <code className="font-mono text-emerald-400">npx agentscore export</code> to
                generate your profile and join the community.
              </p>
              <Link
                href="https://github.com/wkliwk/agent-score"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex items-center gap-2 rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-600 transition-colors"
              >
                Get started
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {paginated.map((profile) => (
                <ProfileCard key={profile.username} profile={profile} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-10 flex items-center justify-center gap-3">
              {page > 1 && (
                <Link
                  href={`/explore?sort=${sort}&dimension=${dimension}&page=${page - 1}`}
                  className="rounded-lg border border-white/15 bg-[#12121a] px-4 py-2 text-sm text-white/70 hover:text-white hover:border-white/30 transition-colors"
                >
                  ← Prev
                </Link>
              )}
              <span className="text-sm text-white/40">
                {page} / {totalPages}
              </span>
              {page < totalPages && (
                <Link
                  href={`/explore?sort=${sort}&dimension=${dimension}&page=${page + 1}`}
                  className="rounded-lg border border-white/15 bg-[#12121a] px-4 py-2 text-sm text-white/70 hover:text-white hover:border-white/30 transition-colors"
                >
                  Next →
                </Link>
              )}
            </div>
          )}
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

