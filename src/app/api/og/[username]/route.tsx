import { ImageResponse } from "@vercel/og";
import { NextRequest } from "next/server";
import { getMockProfile } from "@/lib/mock-profiles";

export const runtime = "edge";

const DIM_COLORS = ["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#f43f5e", "#06b6d4"];
const DIM_LABELS = ["Automation", "Memory", "Agent Coverage", "Tools", "Skills", "Workflow"];

const TIER_COLORS: Record<string, string> = {
  Master: "#f59e0b",
  Expert: "#f59e0b",
  Advanced: "#8b5cf6",
  Intermediate: "#3b82f6",
  Beginner: "#6b7280",
};

function radarPoints(scores: number[], cx: number, cy: number, radius: number): string {
  return scores
    .map((score, i) => {
      const angle = (Math.PI * 2 * i) / scores.length - Math.PI / 2;
      const r = (score / 10) * radius;
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      return `${x},${y}`;
    })
    .join(" ");
}

function axisEndpoint(i: number, total: number, cx: number, cy: number, radius: number): { x: number; y: number } {
  const angle = (Math.PI * 2 * i) / total - Math.PI / 2;
  return {
    x: cx + radius * Math.cos(angle),
    y: cy + radius * Math.sin(angle),
  };
}

function labelPosition(i: number, total: number, cx: number, cy: number, radius: number): { x: number; y: number } {
  const angle = (Math.PI * 2 * i) / total - Math.PI / 2;
  const r = radius + 28;
  return {
    x: cx + r * Math.cos(angle),
    y: cy + r * Math.sin(angle),
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;
  const profile = getMockProfile(username);

  if (!profile) {
    return new Response("Profile not found", { status: 404 });
  }

  const searchParams = request.nextUrl.searchParams;
  const format = searchParams.get("format") ?? "og";
  const isSquare = format === "square";
  const width = isSquare ? 1080 : 1200;
  const height = isSquare ? 1080 : 630;

  const scores = profile.dimensions.map((d) => d.score);
  const tierColor = TIER_COLORS[profile.tier] ?? "#6b7280";

  // Radar chart geometry
  const chartCx = isSquare ? 540 : 380;
  const chartCy = isSquare ? 420 : 315;
  const chartRadius = isSquare ? 180 : 160;

  const gridLevels = [2, 4, 6, 8, 10];

  return new ImageResponse(
    (
      <div
        style={{
          width,
          height,
          display: "flex",
          flexDirection: "column",
          background: "linear-gradient(135deg, #0a0a14 0%, #12121a 50%, #0a0a14 100%)",
          fontFamily: "system-ui, sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Subtle grid background */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.03) 1px, transparent 0)",
            backgroundSize: "40px 40px",
            display: "flex",
          }}
        />

        {isSquare ? (
          // Square layout: stacked
          <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%", padding: "48px" }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "20px" }}>
              <img
                src={profile.avatarUrl}
                width={64}
                height={64}
                style={{ borderRadius: "50%", border: "2px solid rgba(255,255,255,0.15)" }}
              />
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: 28, fontWeight: 700, color: "white" }}>@{profile.username}</span>
                <span style={{ fontSize: 16, color: "rgba(255,255,255,0.5)" }}>AgentScore Profile</span>
              </div>
            </div>

            {/* Score + Tier */}
            <div style={{ display: "flex", alignItems: "baseline", gap: "16px", marginBottom: "12px" }}>
              <span style={{ fontSize: 72, fontWeight: 800, color: tierColor, lineHeight: 1 }}>
                {profile.composite}
              </span>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: 20, fontWeight: 600, color: tierColor }}>{profile.tier}</span>
                <span style={{ fontSize: 14, color: "rgba(255,255,255,0.4)" }}>{profile.tierDescription}</span>
              </div>
            </div>

            {/* Personality */}
            <span style={{ fontSize: 15, color: "rgba(255,255,255,0.5)", fontStyle: "italic", marginBottom: "24px", lineHeight: 1.4 }}>
              &ldquo;{profile.personality}&rdquo;
            </span>

            {/* Radar Chart (SVG) */}
            <div style={{ display: "flex", flex: 1, justifyContent: "center", alignItems: "center" }}>
              <svg width={420} height={420} viewBox="0 0 420 420">
                {/* Grid */}
                {gridLevels.map((level) => (
                  <polygon
                    key={level}
                    points={Array.from({ length: 6 }, (_, i) => {
                      const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2;
                      const r = (level / 10) * 170;
                      return `${210 + r * Math.cos(angle)},${210 + r * Math.sin(angle)}`;
                    }).join(" ")}
                    fill="none"
                    stroke="rgba(255,255,255,0.08)"
                    strokeWidth={1}
                  />
                ))}
                {/* Axes */}
                {Array.from({ length: 6 }, (_, i) => {
                  const end = axisEndpoint(i, 6, 210, 210, 170);
                  return <line key={i} x1={210} y1={210} x2={end.x} y2={end.y} stroke="rgba(255,255,255,0.08)" strokeWidth={1} />;
                })}
                {/* Data polygon */}
                <polygon
                  points={radarPoints(scores, 210, 210, 170)}
                  fill="rgba(99,102,241,0.15)"
                  stroke="#6366f1"
                  strokeWidth={2.5}
                />
                {/* Data points */}
                {scores.map((score, i) => {
                  const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2;
                  const r = (score / 10) * 170;
                  return <circle key={i} cx={210 + r * Math.cos(angle)} cy={210 + r * Math.sin(angle)} r={5} fill={DIM_COLORS[i]} />;
                })}
                {/* Labels */}
                {DIM_LABELS.map((label, i) => {
                  const pos = labelPosition(i, 6, 210, 210, 170);
                  return (
                    <text
                      key={i}
                      x={pos.x}
                      y={pos.y}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill={DIM_COLORS[i]}
                      fontSize={12}
                      fontWeight={600}
                    >
                      {label}
                    </text>
                  );
                })}
              </svg>
            </div>

            {/* Strengths pills */}
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "16px" }}>
              {profile.strengths.slice(0, 3).map((s) => (
                <span
                  key={s.dimension}
                  style={{
                    padding: "6px 14px",
                    borderRadius: "20px",
                    fontSize: 13,
                    fontWeight: 600,
                    background: "rgba(99,102,241,0.12)",
                    color: "#818cf8",
                    border: "1px solid rgba(99,102,241,0.2)",
                  }}
                >
                  {s.dimension}
                </span>
              ))}
            </div>

            {/* Branding */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "20px" }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.3)" }}>agentscore.dev</span>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.2)" }}>agentscore.dev/u/{profile.username}</span>
            </div>
          </div>
        ) : (
          // OG (1200x630) layout: side by side
          <div style={{ display: "flex", width: "100%", height: "100%", padding: "40px 48px" }}>
            {/* Left side: info */}
            <div style={{ display: "flex", flexDirection: "column", width: "440px", justifyContent: "center" }}>
              {/* Avatar + username */}
              <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "20px" }}>
                <img
                  src={profile.avatarUrl}
                  width={52}
                  height={52}
                  style={{ borderRadius: "50%", border: "2px solid rgba(255,255,255,0.15)" }}
                />
                <span style={{ fontSize: 26, fontWeight: 700, color: "white" }}>@{profile.username}</span>
              </div>

              {/* Score */}
              <div style={{ display: "flex", alignItems: "baseline", gap: "12px", marginBottom: "8px" }}>
                <span style={{ fontSize: 80, fontWeight: 800, color: tierColor, lineHeight: 1 }}>
                  {profile.composite}
                </span>
                <span style={{ fontSize: 24, color: "rgba(255,255,255,0.3)" }}>/10</span>
              </div>

              {/* Tier */}
              <span
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  color: tierColor,
                  padding: "4px 12px",
                  borderRadius: "12px",
                  background: `${tierColor}18`,
                  marginBottom: "16px",
                  display: "flex",
                  width: "fit-content",
                }}
              >
                {profile.tier} — {profile.tierDescription}
              </span>

              {/* Personality */}
              <span style={{ fontSize: 14, color: "rgba(255,255,255,0.45)", fontStyle: "italic", lineHeight: 1.5, marginBottom: "20px" }}>
                &ldquo;{profile.personality}&rdquo;
              </span>

              {/* Strength pills */}
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {profile.strengths.slice(0, 3).map((s) => (
                  <span
                    key={s.dimension}
                    style={{
                      padding: "5px 12px",
                      borderRadius: "16px",
                      fontSize: 12,
                      fontWeight: 600,
                      background: "rgba(99,102,241,0.12)",
                      color: "#818cf8",
                      border: "1px solid rgba(99,102,241,0.2)",
                    }}
                  >
                    {s.dimension}
                  </span>
                ))}
              </div>

              {/* Branding */}
              <div style={{ display: "flex", marginTop: "auto", paddingTop: "16px" }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.25)" }}>agentscore.dev</span>
              </div>
            </div>

            {/* Right side: radar chart */}
            <div style={{ display: "flex", flex: 1, justifyContent: "center", alignItems: "center" }}>
              <svg width={440} height={440} viewBox="0 0 440 440">
                {/* Grid */}
                {gridLevels.map((level) => (
                  <polygon
                    key={level}
                    points={Array.from({ length: 6 }, (_, i) => {
                      const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2;
                      const r = (level / 10) * 170;
                      return `${220 + r * Math.cos(angle)},${220 + r * Math.sin(angle)}`;
                    }).join(" ")}
                    fill="none"
                    stroke="rgba(255,255,255,0.08)"
                    strokeWidth={1}
                  />
                ))}
                {/* Axes */}
                {Array.from({ length: 6 }, (_, i) => {
                  const end = axisEndpoint(i, 6, 220, 220, 170);
                  return <line key={i} x1={220} y1={220} x2={end.x} y2={end.y} stroke="rgba(255,255,255,0.08)" strokeWidth={1} />;
                })}
                {/* Data polygon */}
                <polygon
                  points={radarPoints(scores, 220, 220, 170)}
                  fill="rgba(99,102,241,0.15)"
                  stroke="#6366f1"
                  strokeWidth={2.5}
                />
                {/* Data points */}
                {scores.map((score, i) => {
                  const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2;
                  const r = (score / 10) * 170;
                  return <circle key={i} cx={220 + r * Math.cos(angle)} cy={220 + r * Math.sin(angle)} r={5} fill={DIM_COLORS[i]} />;
                })}
                {/* Labels */}
                {DIM_LABELS.map((label, i) => {
                  const pos = labelPosition(i, 6, 220, 220, 170);
                  return (
                    <text
                      key={i}
                      x={pos.x}
                      y={pos.y}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill={DIM_COLORS[i]}
                      fontSize={12}
                      fontWeight={600}
                    >
                      {label}
                    </text>
                  );
                })}
              </svg>
            </div>
          </div>
        )}
      </div>
    ),
    {
      width,
      height,
    }
  );
}
