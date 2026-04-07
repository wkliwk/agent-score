"use client";

import { useRouter, usePathname } from "next/navigation";
import { useCallback } from "react";
import type { TierLabel } from "@/lib/scoring/types";

interface ExploreFiltersProps {
  sort: string;
  dimension: string;
  tier: string;
}

const DIMENSIONS = [
  { value: "all", label: "All dimensions" },
  { value: "automation", label: "Automation" },
  { value: "memory", label: "Memory" },
  { value: "agentCoverage", label: "Agent Coverage" },
  { value: "toolIntegrations", label: "Tool Integrations" },
  { value: "skillBreadth", label: "Skill Breadth" },
  { value: "workflowDepth", label: "Workflow Depth" },
];

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "score", label: "Highest Score" },
  { value: "imports", label: "Most Imported" },
] as const;

type SortValue = (typeof SORT_OPTIONS)[number]["value"];

interface TierOption {
  value: TierLabel | "all";
  label: string;
  activeClass: string;
  inactiveClass: string;
}

const TIER_OPTIONS: TierOption[] = [
  {
    value: "all",
    label: "All tiers",
    activeClass: "border-white/40 bg-white/10 text-white",
    inactiveClass: "border-white/10 text-white/40 hover:text-white/70 hover:border-white/20",
  },
  {
    value: "Beginner",
    label: "Beginner",
    activeClass: "border-slate-400/60 bg-slate-400/20 text-slate-300",
    inactiveClass: "border-slate-400/20 text-slate-400/50 hover:text-slate-400/80 hover:border-slate-400/40",
  },
  {
    value: "Intermediate",
    label: "Intermediate",
    activeClass: "border-emerald-400/60 bg-emerald-400/20 text-emerald-300",
    inactiveClass: "border-emerald-400/20 text-emerald-400/50 hover:text-emerald-400/80 hover:border-emerald-400/40",
  },
  {
    value: "Advanced",
    label: "Advanced",
    activeClass: "border-blue-400/60 bg-blue-400/20 text-blue-300",
    inactiveClass: "border-blue-400/20 text-blue-400/50 hover:text-blue-400/80 hover:border-blue-400/40",
  },
  {
    value: "Expert",
    label: "Expert",
    activeClass: "border-violet-400/60 bg-violet-400/20 text-violet-300",
    inactiveClass: "border-violet-400/20 text-violet-400/50 hover:text-violet-400/80 hover:border-violet-400/40",
  },
  {
    value: "Master",
    label: "Master",
    activeClass: "border-amber-400/60 bg-amber-400/20 text-amber-300",
    inactiveClass: "border-amber-400/20 text-amber-400/50 hover:text-amber-400/80 hover:border-amber-400/40",
  },
];

export default function ExploreFilters({ sort, dimension, tier }: ExploreFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();

  const updateParams = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams();
      if (key !== "sort") params.set("sort", sort);
      if (key !== "dimension") params.set("dimension", dimension);
      if (key !== "tier") params.set("tier", tier);
      params.set(key, value);
      params.set("page", "1");
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, sort, dimension, tier]
  );

  return (
    <div className="mb-6 flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        {/* Sort toggle */}
        <div className="flex rounded-lg border border-white/10 overflow-hidden">
          {SORT_OPTIONS.map((s: { value: SortValue; label: string }) => (
            <button
              key={s.value}
              onClick={() => updateParams("sort", s.value)}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                sort === s.value
                  ? "bg-indigo-500 text-white"
                  : "bg-[#12121a] text-white/50 hover:text-white"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Dimension select */}
        <div className="relative">
          <select
            value={dimension}
            onChange={(e) => updateParams("dimension", e.target.value)}
            className="appearance-none rounded-lg border border-white/10 bg-[#12121a] px-3 py-1.5 pr-7 text-xs text-white/70 hover:text-white focus:outline-none focus:border-indigo-500/50 transition-colors cursor-pointer"
            aria-label="Filter by dimension"
          >
            {DIMENSIONS.map((d) => (
              <option key={d.value} value={d.value} className="bg-[#12121a] text-white">
                {d.label}
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-white/40 text-xs">
            ▾
          </span>
        </div>
      </div>

      {/* Tier pills */}
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter by tier">
        {TIER_OPTIONS.map((t) => {
          const isActive = tier === t.value;
          return (
            <button
              key={t.value}
              onClick={() => updateParams("tier", t.value)}
              aria-pressed={isActive}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors bg-[#12121a] ${
                isActive ? t.activeClass : t.inactiveClass
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
