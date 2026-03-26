"use client";

import { useRouter, usePathname } from "next/navigation";
import { useCallback } from "react";

interface ExploreFiltersProps {
  sort: string;
  dimension: string;
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

export default function ExploreFilters({ sort, dimension }: ExploreFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();

  const updateParams = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams();
      if (key !== "sort") params.set("sort", sort);
      if (key !== "dimension") params.set("dimension", dimension);
      params.set(key, value);
      params.set("page", "1");
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, sort, dimension]
  );

  return (
    <div className="mb-6 flex flex-wrap items-center gap-3">
      {/* Sort toggle */}
      <div className="flex rounded-lg border border-white/10 overflow-hidden">
        {(["newest", "score"] as const).map((s) => (
          <button
            key={s}
            onClick={() => updateParams("sort", s)}
            className={`px-3 py-1.5 text-xs font-medium transition-colors ${
              sort === s
                ? "bg-indigo-500 text-white"
                : "bg-[#12121a] text-white/50 hover:text-white"
            }`}
          >
            {s === "newest" ? "Newest" : "Highest Score"}
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
  );
}
