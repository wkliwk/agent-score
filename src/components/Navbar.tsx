"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <header className="sticky top-0 z-50 h-16 border-b border-white/10 bg-[#0a0a0f]/80 backdrop-blur-sm">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4 md:px-8">
        <Link href="/" className="flex items-center gap-1 font-bold text-lg tracking-tight" onClick={closeMobileMenu}>
          <span className="text-white">Agent</span>
          <span className="text-indigo-400">Score</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden sm:flex items-center gap-2 md:gap-4">
          <Link
            href="/explore"
            className="text-sm text-white/70 hover:text-white transition-colors"
          >
            Explore
          </Link>
          <Link
            href="/benchmark"
            className="text-sm text-white/70 hover:text-white transition-colors"
          >
            Benchmark
          </Link>
          <Link
            href="/publish"
            className="text-sm text-white/70 hover:text-white transition-colors"
          >
            Publish
          </Link>
          <Link
            href="https://github.com/wkliwk/agent-score"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-white/70 hover:text-white transition-colors"
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

        {/* Mobile Menu Button */}
        <button
          className="sm:hidden p-2 text-white/70 hover:text-white transition-colors"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle navigation menu"
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Sign In Button - Always visible on desktop, hidden on mobile */}
        <div className="hidden sm:block">
          <Button
            variant="outline"
            size="sm"
            render={<Link href="/upload" />}
            className="border-white/20 text-white hover:bg-white/10 hover:text-white"
          >
            Sign In
          </Button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-t border-white/10 bg-[#0a0a0f]">
          <nav className="mx-auto max-w-7xl px-4 py-4 space-y-3">
            <Link
              href="/explore"
              className="block text-sm text-white/70 hover:text-white transition-colors py-2"
              onClick={closeMobileMenu}
            >
              Explore
            </Link>
            <Link
              href="/benchmark"
              className="block text-sm text-white/70 hover:text-white transition-colors py-2"
              onClick={closeMobileMenu}
            >
              Benchmark
            </Link>
            <Link
              href="/publish"
              className="block text-sm text-white/70 hover:text-white transition-colors py-2"
              onClick={closeMobileMenu}
            >
              Publish
            </Link>
            <Link
              href="https://github.com/wkliwk/agent-score"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-sm text-white/70 hover:text-white transition-colors py-2"
            >
              GitHub
            </Link>
            <Button
              variant="outline"
              size="sm"
              render={<Link href="/upload" onClick={closeMobileMenu} />}
              className="w-full border-white/20 text-white hover:bg-white/10 hover:text-white"
            >
              Sign In
            </Button>
          </nav>
        </div>
      )}
    </header>
  );
}
