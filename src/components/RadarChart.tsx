"use client";

import {
  Radar,
  RadarChart as RechartsRadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  Legend,
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
  /** Optional second data series for comparison mode */
  secondDimensions?: RadarDimension[];
  /** Legend label for the first series (used when secondDimensions provided) */
  labelA?: string;
  /** Legend label for the second series (used when secondDimensions provided) */
  labelB?: string;
}

export default function RadarChart({
  dimensions,
  size = "hero",
  secondDimensions,
  labelA = "User A",
  labelB = "User B",
}: RadarChartProps) {
  const isHero = size === "hero";
  const fontSize = isHero ? 13 : 0; // thumbnail: hide labels to keep it clean

  const data = dimensions.map((d) => {
    const subject = DIMENSION_LABELS[d.dimension] ?? d.label ?? d.dimension;
    const point: { subject: string; scoreA: number; fullMark: number; scoreB?: number } = {
      subject,
      scoreA: d.score,
      fullMark: 10,
    };
    if (secondDimensions) {
      const match = secondDimensions.find((s) => s.dimension === d.dimension);
      point.scoreB = match?.score ?? 0;
    }
    return point;
  });

  const isCompare = !!secondDimensions;

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
            name={labelA}
            dataKey="scoreA"
            stroke="#6366f1"
            fill="#6366f1"
            fillOpacity={0.25}
            strokeWidth={1.5}
            dot={false}
          />
          {isCompare && (
            <Radar
              name={labelB}
              dataKey="scoreB"
              stroke="#f59e0b"
              fill="#f59e0b"
              fillOpacity={0.2}
              strokeWidth={1.5}
              dot={false}
            />
          )}
        </RechartsRadarChart>
      </div>
    );
  }

  // Hero: use ResponsiveContainer so it never overflows on mobile viewports
  return (
    <div className="w-full" style={{ height: isCompare ? 360 : 320 }}>
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
            name={isCompare ? labelA : "Score"}
            dataKey="scoreA"
            stroke="#6366f1"
            fill="#6366f1"
            fillOpacity={isCompare ? 0.2 : 0.25}
            strokeWidth={2}
            dot={{ fill: "#6366f1", r: 3 }}
          />
          {isCompare && (
            <Radar
              name={labelB}
              dataKey="scoreB"
              stroke="#f59e0b"
              fill="#f59e0b"
              fillOpacity={0.2}
              strokeWidth={2}
              dot={{ fill: "#f59e0b", r: 3 }}
            />
          )}
          {isCompare && (
            <Legend
              wrapperStyle={{ paddingTop: 8, fontSize: 12 }}
              formatter={(value: string) => (
                <span style={{ color: "rgba(255,255,255,0.7)" }}>{value}</span>
              )}
            />
          )}
        </RechartsRadarChart>
      </ResponsiveContainer>
    </div>
  );
}
