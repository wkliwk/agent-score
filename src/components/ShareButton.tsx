"use client";

import { useState } from "react";
import { Share2, Check, Link as LinkIcon } from "lucide-react";

interface ShareButtonProps {
  username: string;
}

export default function ShareButton({ username }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const profileUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/u/${username}`
      : `/u/${username}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard write failed silently
    }
  };

  const handleShare = async () => {
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({
          title: `${username} — AgentScore`,
          text: `Check out my AgentScore profile`,
          url: profileUrl,
        });
      } catch {
        // share cancelled or failed
      }
    } else {
      await handleCopyLink();
    }
  };

  return (
    <>
      <button
        onClick={handleShare}
        className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-600 transition-colors"
      >
        <Share2 size={14} />
        Share Profile
      </button>
      <button
        onClick={handleCopyLink}
        className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 px-4 py-2 text-sm font-medium text-white/70 hover:text-white hover:border-white/40 transition-colors"
      >
        {copied ? (
          <>
            <Check size={14} className="text-emerald-400" />
            <span className="text-emerald-400">Copied!</span>
          </>
        ) : (
          <>
            <LinkIcon size={14} />
            Copy Link
          </>
        )}
      </button>
    </>
  );
}
