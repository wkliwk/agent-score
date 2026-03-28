import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 h-16 border-b border-white/10 bg-[#0a0a0f]/80 backdrop-blur-sm">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4 md:px-8">
        <Link href="/" className="flex items-center gap-1 font-bold text-lg tracking-tight">
          <span className="text-white">Agent</span>
          <span className="text-indigo-400">Score</span>
        </Link>

        <nav className="flex items-center gap-2 md:gap-4">
          <Link
            href="/explore"
            className="text-sm text-white/70 hover:text-white transition-colors hidden sm:inline"
          >
            Explore
          </Link>
          <Link
            href="/benchmark"
            className="text-sm text-white/70 hover:text-white transition-colors hidden sm:inline"
          >
            Benchmark
          </Link>
          <Link
            href="/publish"
            className="text-sm text-white/70 hover:text-white transition-colors hidden sm:inline"
          >
            Publish
          </Link>
          <Link
            href="https://github.com/wkliwk/agent-score"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-white/70 hover:text-white transition-colors hidden sm:inline"
          >
            GitHub
          </Link>
          <Button
            variant="outline"
            size="sm"
            render={<Link href="/upload" />}
            className="border-white/20 text-white hover:bg-white/10 hover:text-white"
          >
            Sign In
          </Button>
        </nav>
      </div>
    </header>
  );
}
