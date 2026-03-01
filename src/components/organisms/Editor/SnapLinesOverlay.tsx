"use client";
import { useSnapLinesStore } from "@/application/useSnapLinesStore";

interface SnapLinesOverlayProps {
  canvasWidth: number;
  canvasHeight: number;
}

export function SnapLinesOverlay({ canvasWidth, canvasHeight }: SnapLinesOverlayProps) {
  const lines = useSnapLinesStore((s) => s.lines);
  if (lines.length === 0) return null;

  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      style={{ width: canvasWidth, height: canvasHeight, zIndex: 50 }}
    >
      {lines.map((line, i) =>
        line.type === "vertical" ? (
          <line
            key={i}
            x1={line.position} y1={0}
            x2={line.position} y2={canvasHeight}
            stroke="hsl(var(--primary))"
            strokeWidth="1"
            strokeDasharray="4 2"
            opacity="0.8"
          />
        ) : (
          <line
            key={i}
            x1={0} y1={line.position}
            x2={canvasWidth} y2={line.position}
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
