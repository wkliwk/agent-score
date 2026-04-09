"use client";

import { useEffect, useState } from "react";

interface TerminalLine {
  text: string;
  color?: "green" | "white" | "dim" | "yellow" | "cyan";
  delay: number; // ms after previous line finishes
  typing?: boolean; // typewriter effect for this line
}

const TERMINAL_LINES: TerminalLine[] = [
  { text: "$ npx agentscore export", color: "green", delay: 400, typing: true },
  { text: "", color: "dim", delay: 300 },
  { text: "Scanning ~/.claude/ ...", color: "dim", delay: 100 },
  { text: "", color: "dim", delay: 50 },
  { text: "  agents       8 found", color: "white", delay: 120 },
  { text: "  mcp-servers  12 found", color: "white", delay: 100 },
  { text: "  hooks        4 found", color: "white", delay: 100 },
  { text: "  commands     23 found", color: "white", delay: 100 },
  { text: "  memory       MEMORY.md index + 14 files", color: "white", delay: 100 },
  { text: "", color: "dim", delay: 200 },
  { text: "Score preview:", color: "cyan", delay: 100 },
  { text: "", color: "dim", delay: 50 },
  { text: "  Automation     ████████░░  8.0", color: "yellow", delay: 120 },
  { text: "  Memory         █████████░  9.0", color: "yellow", delay: 100 },
  { text: "  Agent Coverage ████████░░  8.0", color: "yellow", delay: 100 },
  { text: "  Tool Integ.    ██████░░░░  6.0", color: "yellow", delay: 100 },
  { text: "  Skill Breadth  ████████░░  8.0", color: "yellow", delay: 100 },
  { text: "  Workflow Depth █████████░  9.0", color: "yellow", delay: 100 },
  { text: "", color: "dim", delay: 200 },
  { text: "  AgentScore     8.5  •  Master — Full Autonomy", color: "green", delay: 300 },
  { text: "", color: "dim", delay: 200 },
  { text: "Submit this manifest to agentscore.dev? (y/n) y", color: "dim", delay: 400, typing: true },
  { text: "", color: "dim", delay: 200 },
  { text: "Profile live at: agentscore.dev/u/wkliwk", color: "cyan", delay: 300 },
];

const COLOR_CLASSES: Record<NonNullable<TerminalLine["color"]>, string> = {
  green: "text-emerald-400",
  white: "text-white/80",
  dim: "text-white/30",
  yellow: "text-amber-400",
  cyan: "text-sky-400",
};

const TYPING_SPEED = 40; // ms per character

export default function TerminalAnimation() {
  const [visibleLines, setVisibleLines] = useState<number>(0);
  const [typingProgress, setTypingProgress] = useState<number>(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      for (let i = 0; i < TERMINAL_LINES.length; i++) {
        if (cancelled) return;

        const line = TERMINAL_LINES[i];

        // Wait the delay before showing this line
        await sleep(line.delay);
        if (cancelled) return;

        if (line.typing && line.text.length > 0) {
          // Show line slot first
          setVisibleLines(i + 1);
          // Then type characters one by one
          for (let c = 1; c <= line.text.length; c++) {
            if (cancelled) return;
            setTypingProgress(c);
            await sleep(TYPING_SPEED);
          }
          setTypingProgress(0);
        } else {
          setVisibleLines(i + 1);
        }
      }
      if (!cancelled) setIsComplete(true);
    }

    run();
    return () => {
      cancelled = true;
    };
  }, []);

  // Restart animation after a pause when complete
  useEffect(() => {
    if (!isComplete) return;
    const t = setTimeout(() => {
      setVisibleLines(0);
      setTypingProgress(0);
      setIsComplete(false);
    }, 4000);
    return () => clearTimeout(t);
  }, [isComplete]);

  return (
    <div
      className="rounded-xl bg-[#0d0d14] border border-white/10 p-5 font-mono text-xs leading-relaxed w-full overflow-hidden"
      aria-label="Terminal animation showing npx agentscore export"
      role="img"
    >
      {/* Terminal title bar */}
      <div className="flex items-center gap-1.5 mb-4">
        <span className="h-2.5 w-2.5 rounded-full bg-red-500/60" />
        <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/60" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/60" />
        <span className="ml-2 text-white/30 text-[10px]">terminal</span>
      </div>

      {/* Lines */}
      <div className="space-y-0.5 min-h-[280px]">
        {TERMINAL_LINES.slice(0, visibleLines).map((line, idx) => {
          const colorClass = COLOR_CLASSES[line.color ?? "white"];
          const isCurrentTypingLine =
            idx === visibleLines - 1 && line.typing && typingProgress > 0;
          const displayText = isCurrentTypingLine
            ? line.text.slice(0, typingProgress)
            : line.text;

          return (
            <div key={idx} className={`${colorClass} whitespace-pre`}>
              {displayText}
              {isCurrentTypingLine && (
                <span className="inline-block w-1.5 h-3 bg-white/60 ml-0.5 animate-pulse align-middle" />
              )}
            </div>
          );
        })}
        {/* Blinking cursor at end */}
        {isComplete && (
          <div className="text-white/30">
            <span className="inline-block w-1.5 h-3 bg-white/40 animate-pulse align-middle" />
          </div>
        )}
      </div>
    </div>
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
