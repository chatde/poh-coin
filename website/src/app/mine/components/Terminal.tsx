"use client";

import { useEffect, useRef, ReactNode } from "react";

interface TerminalProps {
  children: ReactNode;
  className?: string;
}

// Each row is a string of 0s and 1s. 1 = filled block, 0 = empty.
// P(8) + gap(1) + O(8) + gap(1) + H(8) = 26 columns
const LOGO_GRID = [
  "11111100011111100110000011",
  "11000110111001110110000011",
  "11111100111001110111111111",
  "11000000111001110110000011",
  "11000000111001110110000011",
  "11000000011111100110000011",
];

export function Terminal({ children, className = "" }: TerminalProps) {
  return (
    <div
      className={`bg-black text-green-400 font-mono min-h-screen p-4 ${className}`}
      style={{
        textShadow: "0 0 5px rgba(0, 255, 65, 0.4)",
        backgroundImage:
          "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,65,0.03) 2px, rgba(0,255,65,0.03) 4px)",
      }}
    >
      {children}
    </div>
  );
}

export function TerminalHeader() {
  return (
    <div className="mb-6">
      <div className="flex justify-center">
        <div
          className="inline-grid gap-0"
          style={{
            gridTemplateColumns: `repeat(${LOGO_GRID[0].length}, 8px)`,
            gridTemplateRows: `repeat(${LOGO_GRID.length}, 8px)`,
          }}
        >
          {LOGO_GRID.map((row, y) =>
            row.split("").map((cell, x) => (
              <div
                key={`${y}-${x}`}
                className={cell === "1" ? "bg-green-500" : ""}
                style={{
                  width: 8,
                  height: 8,
                  boxShadow: cell === "1" ? "0 0 4px rgba(0,255,65,0.4)" : "none",
                }}
              />
            ))
          )}
        </div>
      </div>
      <div className="text-green-500 text-xs text-center tracking-widest uppercase">
        PROOF OF PLANET &nbsp;·&nbsp; v{process.env.NEXT_PUBLIC_APP_VERSION || "0.1.0"}
      </div>
      <div className="border-b border-green-800 mt-3 mb-4" />
    </div>
  );
}

export function TerminalLine({
  prefix = ">",
  children,
  dim = false,
}: {
  prefix?: string;
  children: ReactNode;
  dim?: boolean;
}) {
  return (
    <div className={`flex gap-2 ${dim ? "text-green-700" : "text-green-400"}`}>
      <span className="text-green-600 shrink-0">{prefix}</span>
      <span>{children}</span>
    </div>
  );
}

export function TerminalStatus({
  label,
  value,
  color = "green",
  hint,
}: {
  label: string;
  value: string | number;
  color?: "green" | "yellow" | "red" | "blue";
  hint?: string;
}) {
  const colorMap = {
    green: "text-green-400",
    yellow: "text-yellow-400",
    red: "text-red-400",
    blue: "text-blue-400",
  };

  return (
    <div className="border-b border-green-900 py-1">
      <div className="flex justify-between">
        <span className="text-green-600">{label}</span>
        <span className={colorMap[color]}>{value}</span>
      </div>
      {hint && (
        <div className="text-green-800 text-[10px] mt-0.5">{hint}</div>
      )}
    </div>
  );
}

export function TerminalProgress({ percent }: { percent: number }) {
  const filled = Math.round(percent / 5);
  const empty = 20 - filled;
  const bar = "█".repeat(filled) + "░".repeat(empty);

  return (
    <div className="font-mono text-sm">
      <span className="text-green-600">[</span>
      <span className="text-green-400">{bar}</span>
      <span className="text-green-600">]</span>
      <span className="text-green-500 ml-2">{percent}%</span>
    </div>
  );
}

export function BlinkingCursor() {
  return (
    <span className="inline-block w-2 h-4 bg-green-400 animate-pulse ml-1" />
  );
}

export function TerminalLog({ entries }: { entries: string[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entries]);

  return (
    <div
      ref={scrollRef}
      className="h-48 overflow-y-auto border border-green-900 rounded p-2 mt-4"
      style={{ scrollbarWidth: "thin", scrollbarColor: "#166534 #000" }}
    >
      {entries.map((entry, i) => (
        <div key={i} className="text-green-700 text-xs leading-relaxed">
          <span className="text-green-900">[{String(i).padStart(3, "0")}]</span>{" "}
          {entry}
        </div>
      ))}
      {entries.length === 0 && (
        <div className="text-green-900 text-xs">
          Awaiting mission data...
        </div>
      )}
    </div>
  );
}
