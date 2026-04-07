"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";

interface ScoreHistoryProps {
  scoredAt: string | null;
  previousScore: number | null;
  currentScore: number;
  historyCount: number;
  isOwner: boolean;
  username: string;
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay === 1) return "yesterday";
  return `${diffDay}d ago`;
}

export default function ScoreHistory({
  scoredAt,
  previousScore,
  currentScore,
  historyCount,
  isOwner,
  username,
}: ScoreHistoryProps) {
  const [loading, setLoading] = useState(false);

  const delta =
    previousScore !== null ? +(currentScore - previousScore).toFixed(1) : null;

  const handleRescan = async () => {
    setLoading(true);
    try {
      // Fetch current manifest from the profile
      const profileRes = await fetch(`/api/profiles/${username}`);
      if (!profileRes.ok) throw new Error("Failed to fetch profile");
      const profileData = await profileRes.json();

      // Re-submit the manifest to trigger re-scoring
      const res = await fetch("/api/profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ manifest: profileData.manifestSnapshot }),
      });
      if (!res.ok) throw new Error("Rescan failed");

      // Refresh the page to show updated scores
      window.location.reload();
    } catch {
      // Silently fail — user can try again
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-2 mt-3">
      {/* Last updated */}
      {scoredAt && (
        <p className="text-xs text-white/40">
          Last updated: {timeAgo(scoredAt)}
        </p>
      )}

      {/* Delta badge */}
      {delta !== null && delta !== 0 && (
        <span
          className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-mono font-medium ${
            delta > 0
              ? "bg-emerald-500/15 text-emerald-400"
              : "bg-rose-500/15 text-rose-400"
          }`}
        >
          {delta > 0 ? "+" : ""}
          {delta} pts
        </span>
      )}

      {/* First scan message */}
      {historyCount <= 1 && (
        <p className="text-xs text-white/30 max-w-xs text-center">
          Run the CLI again after improving your setup to see your progress
        </p>
      )}

      {/* Rescan button (owner only) */}
      {isOwner && (
        <button
          onClick={handleRescan}
          disabled={loading}
          className="mt-2 inline-flex items-center gap-2 rounded-lg border border-white/10 bg-[#12121a] px-3 py-1.5 text-xs font-medium text-white/70 hover:text-white hover:border-white/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw
            size={13}
            className={loading ? "animate-spin" : ""}
          />
          {loading ? "Rescanning..." : "Rescan"}
        </button>
      )}
    </div>
  );
}
