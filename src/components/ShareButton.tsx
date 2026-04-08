"use client";

import { useState } from "react";
import { Check, Link as LinkIcon } from "lucide-react";

interface ShareButtonProps {
  username: string;
  score: number;
  tier: string;
}

const XIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.259 5.631 5.905-5.631Zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

export default function ShareButton({ username, score, tier }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const profileUrl = `https://agentscore.dev/u/${username}`;

  const tweetText = `I scored ${score}/10 on AgentScore — ${tier} tier. Check your Claude Code setup: ${profileUrl}`;
  const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard write failed silently
    }
  };

  return (
    <>
      <a
        href={tweetUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 px-3 py-1.5 text-xs font-medium text-white/70 hover:text-white hover:border-white/40 transition-colors"
      >
        <XIcon />
        Share on X
      </a>
      <button
        onClick={handleCopyLink}
        className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 px-3 py-1.5 text-xs font-medium text-white/70 hover:text-white hover:border-white/40 transition-colors"
      >
        {copied ? (
          <>
            <Check size={13} className="text-emerald-400" />
            <span className="text-emerald-400">Copied!</span>
          </>
        ) : (
          <>
            <LinkIcon size={13} />
            Copy link
          </>
        )}
      </button>
    </>
  );
}
