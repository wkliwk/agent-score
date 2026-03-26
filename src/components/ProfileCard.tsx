import Link from "next/link";
import Image from "next/image";
import RadarChart from "@/components/RadarChart";
import type { MockProfile } from "@/lib/mock-profiles";

const TIER_COLORS: Record<string, string> = {
  Master: "#f59e0b",
  Expert: "#f59e0b",
  Advanced: "#8b5cf6",
  Intermediate: "#3b82f6",
  Beginner: "#6b7280",
};

const DIM_COLORS: Record<string, string> = {
  automation: "#3b82f6",
  memory: "#10b981",
  agentCoverage: "#8b5cf6",
  toolIntegrations: "#f59e0b",
  skillBreadth: "#f43f5e",
  workflowDepth: "#06b6d4",
};

const DIM_INITIALS: Record<string, string> = {
  automation: "Au",
  memory: "Me",
  agentCoverage: "Ag",
  toolIntegrations: "To",
  skillBreadth: "Sk",
  workflowDepth: "Wf",
};

interface ProfileCardProps {
  profile: MockProfile;
}

export default function ProfileCard({ profile }: ProfileCardProps) {
  const tierColor = TIER_COLORS[profile.tier] ?? "#6b7280";

  return (
    <Link
      href={`/u/${profile.username}`}
      className="group block rounded-xl bg-[#12121a] border border-white/10 hover:border-indigo-500/50 p-5 transition-colors"
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-9 w-9 rounded-full overflow-hidden shrink-0 bg-white/10">
            <Image
              src={profile.avatarUrl}
              alt={profile.username}
              width={36}
              height={36}
              className="h-full w-full object-cover"
              unoptimized
            />
          </div>
          <span className="font-mono text-sm font-semibold text-white truncate">
            @{profile.username}
          </span>
        </div>
        <div className="flex flex-col items-end shrink-0">
          <span className="text-2xl font-bold leading-none" style={{ color: tierColor }}>
            {profile.composite}
          </span>
          <span
            className="mt-1 rounded px-1.5 py-0.5 text-xs font-medium"
            style={{ backgroundColor: `${tierColor}18`, color: tierColor }}
          >
            {profile.tierDescription}
          </span>
        </div>
      </div>

      {/* Radar + personality */}
      <div className="flex gap-4 items-start mb-4">
        <div className="shrink-0">
          <RadarChart dimensions={profile.dimensions} size="thumbnail" />
        </div>
        <p className="text-xs text-white/55 leading-relaxed line-clamp-4 pt-1">
          {profile.personality}
        </p>
      </div>

      {/* Dimension pills */}
      <div className="flex flex-wrap gap-1.5">
        {profile.dimensions.map((d) => {
          const color = DIM_COLORS[d.dimension] ?? "#6b7280";
          const initials = DIM_INITIALS[d.dimension] ?? d.dimension.slice(0, 2);
          return (
            <span
              key={d.dimension}
              className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-mono"
              style={{ backgroundColor: `${color}18`, color }}
            >
              {initials}:{d.score}
            </span>
          );
        })}
      </div>

      {/* View link */}
      <div className="mt-4 text-xs text-indigo-400 group-hover:text-indigo-300 transition-colors">
        View profile →
      </div>
    </Link>
  );
}
