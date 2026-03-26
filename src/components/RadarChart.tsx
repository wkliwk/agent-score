"use client";

import {
  Radar,
  RadarChart as RechartsRadarChart,
  PolarGrid,
  PolarAngleAxis,
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
  const containerSize = isHero ? 480 : 160;
  const fontSize = isHero ? 13 : 0; // thumbnail: hide labels to keep it clean

  const data = dimensions.map((d) => ({
    subject: DIMENSION_LABELS[d.dimension] ?? d.label ?? d.dimension,
    score: d.score,
    fullMark: 10,
  }));

  return (
    <div
      style={{ width: containerSize, height: containerSize }}
      className="mx-auto"
    >
      <RechartsRadarChart
        width={containerSize}
        height={containerSize}
        cx="50%"
        cy="50%"
        outerRadius={isHero ? "65%" : "70%"}
        data={data}
      >
        <PolarGrid stroke="rgba(255,255,255,0.1)" />
        {fontSize > 0 && (
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fill: "rgba(255,255,255,0.8)", fontSize, fontFamily: "Inter, sans-serif" }}
          />
        )}
        <Radar
          name="Score"
          dataKey="score"
          stroke="#6366f1"
          fill="#6366f1"
          fillOpacity={0.25}
          strokeWidth={isHero ? 2 : 1.5}
          dot={isHero ? { fill: "#6366f1", r: 3 } : false}
        />
      </RechartsRadarChart>
    </div>
  );
}
