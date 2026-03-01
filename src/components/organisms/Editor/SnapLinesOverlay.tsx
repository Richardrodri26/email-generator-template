"use client";
import { useSnapLinesStore } from "@/application/useSnapLinesStore";

// Large enough to span any canvas; SVG clips automatically at its boundary.
const FAR = 9999;

export function SnapLinesOverlay() {
  const lines = useSnapLinesStore((s) => s.lines);
  if (lines.length === 0) return null;

  return (
    <svg
      className="absolute inset-0 pointer-events-none overflow-visible"
      width="100%"
      height="100%"
      style={{ zIndex: 50 }}
    >
      {lines.map((line, i) =>
        line.type === "vertical" ? (
          <line
            key={i}
            x1={line.position} y1={0}
            x2={line.position} y2={FAR}
            stroke="hsl(var(--primary))"
            strokeWidth="1"
            strokeDasharray="4 2"
            opacity="0.8"
          />
        ) : (
          <line
            key={i}
            x1={0} y1={line.position}
            x2={FAR} y2={line.position}
            stroke="hsl(var(--primary))"
            strokeWidth="1"
            strokeDasharray="4 2"
            opacity="0.8"
          />
        )
      )}
    </svg>
  );
}
