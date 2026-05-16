"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { GitCompareArrows } from "lucide-react";

interface CompareButtonProps {
  username: string;
}

export default function CompareButton({ username }: CompareButtonProps) {
  const [expanded, setExpanded] = useState(false);
  const [otherUsername, setOtherUsername] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleExpand = () => {
    setExpanded(true);
    // Focus input after state update
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleCompare = () => {
    const trimmed = otherUsername.trim().replace(/^@/, "");
    if (!trimmed) return;
    router.push(`/compare?a=${encodeURIComponent(username)}&b=${encodeURIComponent(trimmed)}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleCompare();
    if (e.key === "Escape") {
      setExpanded(false);
      setOtherUsername("");
    }
  };

  if (!expanded) {
    return (
      <button
        onClick={handleExpand}
        className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 px-3 py-1.5 text-xs font-medium text-white/70 hover:text-white hover:border-white/40 transition-colors"
        aria-label="Compare with another user"
      >
        <GitCompareArrows size={13} />
        Compare
      </button>
    );
  }

  return (
    <div className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-500/40 bg-indigo-500/5 px-2 py-1">
      <GitCompareArrows size={13} className="text-indigo-400 shrink-0" />
      <input
        ref={inputRef}
        type="text"
        placeholder="@username"
        value={otherUsername}
        onChange={(e) => setOtherUsername(e.target.value)}
        onKeyDown={handleKeyDown}
        className="w-28 bg-transparent text-xs text-white placeholder-white/30 outline-none font-mono"
        aria-label="Enter username to compare with"
      />
      <button
        onClick={handleCompare}
        disabled={!otherUsername.trim()}
        className="text-xs font-medium text-indigo-400 hover:text-indigo-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        Go
      </button>
    </div>
  );
}
