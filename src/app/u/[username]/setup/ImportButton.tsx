"use client";

import { useState, useCallback } from "react";
import { Download, Check } from "lucide-react";

interface ImportButtonProps {
  username: string;
}

export default function ImportButton({ username }: ImportButtonProps) {
  const [importing, setImporting] = useState(false);
  const [done, setDone] = useState(false);

  const handleImport = useCallback(async () => {
    setImporting(true);
    try {
      // Fetch bundle data
      const res = await fetch(`/api/bundles/${encodeURIComponent(username)}`);
      if (!res.ok) return;
      const data = await res.json();
      const files = data.files as { path: string; content: string }[];

      // Build a simple JSON download (zip requires a library)
      const bundle = {
        username: data.username,
        exportedAt: new Date().toISOString(),
        files: files.map((f) => ({ path: f.path, content: f.content })),
      };

      const blob = new Blob([JSON.stringify(bundle, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `agentscore-${username}-setup.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Increment import counter
      await fetch(`/api/bundles/${encodeURIComponent(username)}`, {
        method: "POST",
      });

      setDone(true);
      setTimeout(() => setDone(false), 3000);
    } catch {
      // silent fail
    } finally {
      setImporting(false);
    }
  }, [username]);

  return (
    <button
      onClick={handleImport}
      disabled={importing}
      className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {done ? (
        <>
          <Check size={14} />
          Downloaded
        </>
      ) : (
        <>
          <Download size={14} />
          {importing ? "Downloading..." : "Import Setup"}
        </>
      )}
    </button>
  );
}
