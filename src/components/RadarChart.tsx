"use client";

import {
  Radar,
  RadarChart as RechartsRadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
} from "recharts";

const DIMENSION_LABELS: Record<string, string> = {
  automation: "Automation",
  memory: "Memory",
  agentCoverage: "Agent Coverage",
  toolIntegrations: "Tools",
  skillBreadth: "Skills",
  workflowDepth: "Workflow",
};

export interface RadarDimension {
  dimension: string;
  score: number;
  label?: string;
}

export interface RadarChartProps {
  dimensions: RadarDimension[];
  size?: "hero" | "thumbnail";
}

export default function RadarChart({ dimensions, size = "hero" }: RadarChartProps) {
  const isHero = size === "hero";
  const fontSize = isHero ? 13 : 0; // thumbnail: hide labels to keep it clean

  const data = dimensions.map((d) => ({
    subject: DIMENSION_LABELS[d.dimension] ?? d.label ?? d.dimension,
    score: d.score,
    fullMark: 10,
  }));

  if (!isHero) {
    // Thumbnail: fixed small size is intentional (used in OG/badge contexts, not profile page)
    return (
      <div style={{ width: 160, height: 160 }} className="mx-auto">
        <RechartsRadarChart
          width={160}
          height={160}
          cx="50%"
          cy="50%"
          outerRadius="70%"
          data={data}
        >
          <PolarGrid stroke="rgba(255,255,255,0.1)" />
          <Radar
            name="Score"
            dataKey="score"
            stroke="#6366f1"
            fill="#6366f1"
            fillOpacity={0.25}
            strokeWidth={1.5}
            dot={false}
          />
        </RechartsRadarChart>
      </div>
    );
  }

  // Hero: use ResponsiveContainer so it never overflows on mobile viewports
  return (
    <div className="w-full" style={{ height: 320 }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsRadarChart
          cx="50%"
          cy="50%"
          outerRadius="65%"
          data={data}
        >
          <PolarGrid stroke="rgba(255,255,255,0.1)" />
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fill: "rgba(255,255,255,0.8)", fontSize, fontFamily: "Inter, sans-serif" }}
          />
          <Radar
            name="Score"
            dataKey="score"
            stroke="#6366f1"
            fill="#6366f1"
            fillOpacity={0.25}
            strokeWidth={2}
            dot={{ fill: "#6366f1", r: 3 }}
          />
        </RechartsRadarChart>
      </ResponsiveContainer>
    </div>
  );
}
