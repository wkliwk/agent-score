"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

interface Entry {
  totalScore: number;
  scoredAt: string;
}

interface ScoreHistoryChartProps {
  entries: Entry[];
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function ScoreHistoryChart({ entries }: ScoreHistoryChartProps) {
  if (entries.length < 2) return null;

  const data = entries.map((e) => ({
    date: formatDate(e.scoredAt),
    score: e.totalScore,
  }));

  return (
    <div className="w-full max-w-sm rounded-xl bg-[#12121a] border border-white/10 p-4">
      <p className="text-xs uppercase tracking-widest text-white/40 mb-3">
        Score History
      </p>
      <ResponsiveContainer width="100%" height={140}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: "rgba(255,255,255,0.3)" }}
            axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
            tickLine={false}
          />
          <YAxis
            domain={[0, 10]}
            tick={{ fontSize: 10, fill: "rgba(255,255,255,0.3)" }}
            axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
            tickLine={false}
            width={24}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1a1a2e",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "8px",
              fontSize: "12px",
              color: "rgba(255,255,255,0.8)",
            }}
            formatter={(value) => [`${value}`, "Score"]}
          />
          <Line
            type="monotone"
            dataKey="score"
            stroke="#818cf8"
            strokeWidth={2}
            dot={{ fill: "#818cf8", r: 3 }}
            activeDot={{ r: 5, fill: "#6366f1" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
