"use client";

import { useState, useEffect, useRef } from "react";

const SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "report", label: "Report" },
  { id: "levelup", label: "Level Up" },
  { id: "breakdown", label: "Breakdown" },
  { id: "manifest", label: "Manifest" },
] as const;

export default function ProfileNav() {
  const [active, setActive] = useState("overview");
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const elements = SECTIONS.map((s) => document.getElementById(s.id)).filter(
      Boolean
    ) as HTMLElement[];

    if (elements.length === 0) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        // Find the topmost visible section
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort(
            (a, b) =>
              a.boundingClientRect.top - b.boundingClientRect.top
          );
        if (visible.length > 0) {
          setActive(visible[0].target.id);
        }
      },
      { rootMargin: "-80px 0px -60% 0px", threshold: 0 }
    );

    elements.forEach((el) => observerRef.current!.observe(el));

    return () => observerRef.current?.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const offset = 80 + 48; // navbar (64px) + anchor nav (~48px) + gap
    const top = el.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: "smooth" });
  };

  return (
    <nav className="sticky top-16 z-40 -mx-4 border-b border-white/10 bg-[#0a0a0f]/90 backdrop-blur-sm">
      <div className="mx-auto max-w-5xl overflow-x-auto scrollbar-none px-4">
        <div className="flex gap-1 py-2 min-w-max">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              onClick={() => scrollTo(s.id)}
              className={`shrink-0 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                active === s.id
                  ? "bg-indigo-500/15 text-indigo-400"
                  : "text-white/40 hover:text-white/70"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}
