"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";

interface DownloadInfographicProps {
  username: string;
}

export default function DownloadInfographic({ username }: DownloadInfographicProps) {
  const [loading, setLoading] = useState(false);
  const [format, setFormat] = useState<"og" | "square">("og");

  const handleDownload = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/og/${username}?format=${format}`);
      if (!res.ok) throw new Error("Failed to generate image");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `agentscore-${username}-${format === "og" ? "1200x630" : "1080x1080"}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // download failed
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-1.5">
      <select
        value={format}
        onChange={(e) => setFormat(e.target.value as "og" | "square")}
        className="rounded px-2 py-1 text-xs bg-white/5 border border-white/10 text-white/60 focus:outline-none"
      >
        <option value="og">1200x630</option>
        <option value="square">1080x1080</option>
      </select>
      <button
        onClick={handleDownload}
        disabled={loading}
        className="flex items-center gap-1 rounded px-2 py-1 text-xs text-white/60 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50"
      >
        {loading ? (
          <Loader2 size={13} className="animate-spin" />
        ) : (
          <Download size={13} />
        )}
        <span>Download</span>
      </button>
    </div>
  );
}
