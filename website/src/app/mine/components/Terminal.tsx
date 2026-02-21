"use client";

import { useEffect, useRef, ReactNode } from "react";

interface TerminalProps {
  children: ReactNode;
  className?: string;
}

const ASCII_LOGO = `
 ██████╗  ██████╗ ██╗  ██╗
 ██╔══██╗██╔═══██╗██║  ██║
 ██████╔╝██║   ██║███████║
 ██╔═══╝ ██║   ██║██╔══██║
 ██║     ╚██████╔╝██║  ██║
 ╚═╝      ╚═════╝ ╚═╝  ╚═╝
 PROOF OF PLANET  v1.0
`;

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
      <pre className="text-green-500 text-xs leading-tight sm:text-sm">
        {ASCII_LOGO}
      </pre>
      <div className="border-b border-green-800 mt-2 mb-4" />
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
}: {
  label: string;
  value: string | number;
  color?: "green" | "yellow" | "red" | "blue";
}) {
  const colorMap = {
    green: "text-green-400",
    yellow: "text-yellow-400",
    red: "text-red-400",
    blue: "text-blue-400",
  };

  return (
    <div className="flex justify-between border-b border-green-900 py-1">
      <span className="text-green-600">{label}</span>
      <span className={colorMap[color]}>{value}</span>
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
