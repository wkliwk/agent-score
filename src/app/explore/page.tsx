import Link from "next/link";
import { Terminal } from "lucide-react";
import { desc, eq, gte, and, isNotNull, sql } from "drizzle-orm";
import Navbar from "@/components/Navbar";
import ProfileCard from "@/components/ProfileCard";
import ExploreFilters from "@/components/ExploreFilters";
import ExploreSearch from "@/components/ExploreSearch";
import { MOCK_PROFILES } from "@/lib/mock-profiles";
import { dbRowToProfile } from "@/lib/db-to-profile";
import type { MockProfile } from "@/lib/mock-profiles";
import type { DimensionKey } from "@/lib/scoring/types";

export const revalidate = 60;

interface ExplorePageProps {
  searchParams: Promise<{
    sort?: string;
    dimension?: string;
    page?: string;
  }>;
}

const PAGE_SIZE = 6;

function filterByDimension(
  profiles: MockProfile[],
  dimension: string | undefined
): MockProfile[] {
  if (!dimension || dimension === "all") return profiles;
  return profiles.filter((p) => {
    const top = [...p.dimensions].sort((a, b) => b.score - a.score)[0];
    return top?.dimension === (dimension as DimensionKey);
  });
}

async function fetchDbProfiles(
  sort: string,
  page: number
): Promise<{ profiles: MockProfile[]; hasMore: boolean } | null> {
  try {
    const { getDb } = await import("@/db");
    const { profiles: profilesTable, bundles: bundlesTable } = await import("@/db/schema");
    const db = getDb();

    const limit = PAGE_SIZE;
    const offset = (page - 1) * limit;

    if (sort === "imports") {
      // Join profiles with bundles, order by importCount descending
      const rows = await db
        .select({
          id: profilesTable.id,
          githubId: profilesTable.githubId,
          githubLogin: profilesTable.githubLogin,
          displayName: profilesTable.displayName,
          avatarUrl: profilesTable.avatarUrl,
          bio: profilesTable.bio,
          visibility: profilesTable.visibility,
          totalScore: profilesTable.totalScore,
          tier: profilesTable.tier,
          dimensionScores: profilesTable.dimensionScores,
          manifestSnapshot: profilesTable.manifestSnapshot,
          scoredAt: profilesTable.scoredAt,
          createdAt: profilesTable.createdAt,
          updatedAt: profilesTable.updatedAt,
          bundleImportCount: bundlesTable.importCount,
          bundleFiles: bundlesTable.files,
          bundleInspiredBy: bundlesTable.inspiredBy,
        })
        .from(profilesTable)
        .innerJoin(bundlesTable, eq(bundlesTable.profileId, profilesTable.id))
        .where(
          and(
            eq(profilesTable.visibility, "public"),
            gte(profilesTable.totalScore, 0),
            isNotNull(bundlesTable.importCount)
          )
        )
        .orderBy(desc(bundlesTable.importCount))
        .limit(limit + 1)
        .offset(offset);

      const hasMore = rows.length > limit;
      const pageRows = rows.slice(0, limit);

      const converted = pageRows
        .map((row): MockProfile | null => {
          const profile = dbRowToProfile(row);
          if (!profile) return null;

          const files = row.bundleFiles as unknown[];
          const inspiredBy = row.bundleInspiredBy as unknown[];
          const result: MockProfile = {
            ...profile,
            bundle: {
              fileCount: Array.isArray(files) ? files.length : 0,
              importCount: row.bundleImportCount ?? 0,
              inspiredByCount: Array.isArray(inspiredBy) ? inspiredBy.length : 0,
            },
          };
          return result;
        })
        .filter((p): p is MockProfile => p !== null);

      return { profiles: converted, hasMore };
    }

    const orderBy =
      sort === "score"
        ? desc(profilesTable.totalScore)
        : desc(profilesTable.createdAt);

    const rows = await db
      .select()
      .from(profilesTable)
      .where(and(eq(profilesTable.visibility, "public"), gte(profilesTable.totalScore, 0)))
      .orderBy(orderBy)
      .limit(limit + 1)
      .offset(offset);

    const hasMore = rows.length > limit;
    const pageRows = rows.slice(0, limit);

    const converted = pageRows
      .map((row) => dbRowToProfile(row))
      .filter((p): p is MockProfile => p !== null);

    return { profiles: converted, hasMore };
  } catch {
    return null;
  }
}


async function fetchProfileCount(): Promise<number | null> {
  try {
    const { getDb } = await import("@/db");
    const { profiles: profilesTable } = await import("@/db/schema");
    const db = getDb();
    const result = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(profilesTable)
      .where(and(eq(profilesTable.visibility, "public"), isNotNull(profilesTable.totalScore)));
    return result[0]?.count ?? null;
  } catch {
    return null;
  }
}

export default async function ExplorePage({ searchParams }: ExplorePageProps) {
  const params = await searchParams;
  const sort =
    params.sort === "score"
      ? "score"
      : params.sort === "imports"
        ? "imports"
        : "newest";
  const dimension = params.dimension ?? "all";
  const page = Math.max(1, parseInt(params.page ?? "1", 10));

  let profiles: MockProfile[] = [];
  let usedMock = false;
  let hasMore = false;

  const [dbResult, profileCount] = await Promise.all([
    fetchDbProfiles(sort, page),
    fetchProfileCount(),
  ]);

  if (dbResult && dbResult.profiles.length > 0) {
    profiles = filterByDimension(dbResult.profiles, dimension);
    hasMore = dbResult.hasMore;
  } else {
    // Fallback to mock data when DB is empty or unavailable
    usedMock = true;
    const sorted =
      sort === "score"
        ? [...MOCK_PROFILES].sort((a, b) => b.composite - a.composite)
        : sort === "imports"
          ? [...MOCK_PROFILES].sort(
              (a, b) => (b.bundle?.importCount ?? 0) - (a.bundle?.importCount ?? 0)
            )
          : [...MOCK_PROFILES];
    const filtered = filterByDimension(sorted, dimension);
    const start = (page - 1) * PAGE_SIZE;
    profiles = filtered.slice(start, start + PAGE_SIZE);
    hasMore = start + PAGE_SIZE < filtered.length;
  }

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
                  (showing demo data)
                </span>
              )}
            </p>
            {/* Stat line */}
            <p className="mt-1 text-xs text-white/30">
              {profileCount !== null && profileCount > 0
                ? `${profileCount} engineer${profileCount === 1 ? "" : "s"} scored`
                : "Join the community"}
            </p>
          </div>

          {/* Search + content (search hides default content when active) */}
          <ExploreSearch>
            {/* Filters */}
            <ExploreFilters sort={sort} dimension={dimension} />

            {/* Grid */}
            {profiles.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/5 mb-4">
                  <Terminal size={24} className="text-white/40" />
                </div>
                <h2 className="text-lg font-semibold text-white">
                  Be the first to share your setup
                </h2>
                <p className="mt-2 text-sm text-white/50 max-w-xs">
                  Run{" "}
                  <code className="font-mono text-emerald-400">
                    npx agentscore export
                  </code>{" "}
                  to generate your profile and join the community.
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
                {profiles.map((profile) => (
                  <ProfileCard key={profile.username} profile={profile} />
                ))}
              </div>
            )}

            {/* Pagination */}
            {(page > 1 || hasMore) && (
              <div className="mt-10 flex items-center justify-center gap-3">
                {page > 1 && (
                  <Link
                    href={`/explore?sort=${sort}&dimension=${dimension}&page=${page - 1}`}
                    className="rounded-lg border border-white/15 bg-[#12121a] px-4 py-2 text-sm text-white/70 hover:text-white hover:border-white/30 transition-colors"
                  >
                    &larr; Prev
                  </Link>
                )}
                <span className="text-sm text-white/40">Page {page}</span>
                {hasMore && (
                  <Link
                    href={`/explore?sort=${sort}&dimension=${dimension}&page=${page + 1}`}
                    className="rounded-lg border border-white/15 bg-[#12121a] px-4 py-2 text-sm text-white/70 hover:text-white hover:border-white/30 transition-colors"
                  >
                    Next &rarr;
                  </Link>
                )}
              </div>
            )}
          </ExploreSearch>
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
