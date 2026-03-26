import Navbar from "@/components/Navbar";

export default function BadgeTestPage() {
  const username = "wkliwk";

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-16">
        <div className="w-full max-w-lg space-y-8">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">Badge Test</h1>
            <p className="text-sm text-white/50">
              Dev-only page to preview the SVG badge endpoint.
            </p>
          </div>

          <div className="rounded-xl bg-[#12121a] border border-white/10 p-6 space-y-6">
            <div>
              <p className="text-xs uppercase tracking-widest text-white/40 mb-3">
                Badge Preview
              </p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/badge/${username}`}
                alt={`AgentScore badge for ${username}`}
                className="h-5"
              />
            </div>

            <div>
              <p className="text-xs uppercase tracking-widest text-white/40 mb-2">
                Endpoint
              </p>
              <code className="font-mono text-xs text-emerald-400 bg-white/5 px-3 py-2 rounded block">
                GET /api/badge/{username}
              </code>
            </div>

            <div>
              <p className="text-xs uppercase tracking-widest text-white/40 mb-2">
                Markdown embed
              </p>
              <code className="font-mono text-xs text-white/60 bg-white/5 px-3 py-2 rounded block break-all">
                {`![AgentScore](https://agentscore.dev/api/badge/${username})`}
              </code>
            </div>
          </div>

          <p className="text-xs text-white/30 text-center">
            This page is for development testing only.
          </p>
        </div>
      </main>
    </div>
  );
}
