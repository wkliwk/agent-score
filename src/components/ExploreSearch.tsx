"use client";

import { useState, useEffect, useRef, useCallback, type ReactNode } from "react";
import { Search, X } from "lucide-react";
import ProfileCard from "@/components/ProfileCard";
import { dbRowToProfile } from "@/lib/db-to-profile";
import type { MockProfile } from "@/lib/mock-profiles";

interface ProfileApiRow {
  githubLogin: string;
  displayName: string;
  avatarUrl: string | null;
  totalScore: number | null;
  tier: string | null;
  dimensionScores: unknown;
}

interface ExploreSearchProps {
  children: ReactNode;
}

export default function ExploreSearch({ children }: ExploreSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MockProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchResults = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([]);
      setSearched(false);
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setSearched(true);

    try {
      const res = await fetch(
        `/api/profiles?search=${encodeURIComponent(q)}&limit=20`,
        { signal: controller.signal }
      );
      if (!res.ok) throw new Error("fetch failed");
      const json = await res.json();

      const profiles: MockProfile[] = (json.data as ProfileApiRow[])
        .map((row) =>
          dbRowToProfile({
            githubLogin: row.githubLogin,
            avatarUrl: row.avatarUrl,
            totalScore: row.totalScore,
            tier: row.tier,
            dimensionScores: row.dimensionScores ?? null,
            manifestSnapshot: null,
          })
        )
        .filter((p): p is MockProfile => p !== null);

      setResults(profiles);
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setResults([]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => fetchResults(query), 300);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query, fetchResults]);

  const clear = () => {
    setQuery("");
    setResults([]);
    setSearched(false);
  };

  const isActive = query.length >= 2;

  return (
    <>
      {/* Search input */}
      <div className="mb-6">
        <div className="relative w-full sm:max-w-sm">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40"
            aria-hidden="true"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by username..."
            className="w-full rounded-lg border border-white/10 bg-[#12121a] py-2 pl-9 pr-9 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-indigo-500/50 transition-colors"
            aria-label="Search profiles by username"
          />
          {query.length > 0 && (
            <button
              onClick={clear}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
              aria-label="Clear search"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* When search is active, show search results; otherwise show default content */}
      {isActive ? (
        <div>
          {loading && (
            <p className="text-sm text-white/40 py-4">Searching...</p>
          )}

          {!loading && searched && results.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <h2 className="text-base font-semibold text-white/70">
                No profile found for &lsquo;@{query}&rsquo;
              </h2>
              <p className="mt-2 text-sm text-white/40 max-w-xs">
                Be the first to submit yours &mdash; run{" "}
                <code className="font-mono text-emerald-400">
                  npx agentscore export
                </code>
              </p>
            </div>
          )}

          {!loading && results.length > 0 && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((profile) => (
                <ProfileCard key={profile.username} profile={profile} />
              ))}
            </div>
          )}
        </div>
      ) : (
        children
      )}
    </>
  );
}
