# Snap Lines / Alignment Guides — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Show Canva-style colored snap lines during drag when the dragged element's edges align with other elements on the canvas.

**Architecture:** `useSnapLinesStore` (Zustand) holds active snap lines (type + position). `snapLines.ts` utility computes alignment matches by reading DOM bounding boxes. `SnapLinesOverlay` SVG component renders lines over the canvas. `handleDragOver` in the editor page computes and updates lines; `handleDragEnd`/`handleDragStart` clears them.

**Tech Stack:** React 19, Zustand, SVG overlay, DOM getBoundingClientRect

---

### Task 1: Create useSnapLinesStore

**Files:**
- Create: `src/application/useSnapLinesStore.ts`

```typescript
import { create } from "zustand";

export interface SnapLine {
  type: "horizontal" | "vertical";
  position: number; // px from canvas top (horizontal) or left (vertical)
}

interface SnapLinesState {
  lines: SnapLine[];
  setLines: (lines: SnapLine[]) => void;
  clear: () => void;
}

export const useSnapLinesStore = create<SnapLinesState>((set) => ({
  lines: [],
  setLines: (lines) => set({ lines }),
  clear: () => set({ lines: [] }),
}));
```

```bash
git add src/application/useSnapLinesStore.ts
git commit -m "feat: add useSnapLinesStore for snap line state"
```

---

### Task 2: Create snapLines utility

**Files:**
- Create: `src/application/utils/snapLines.ts`

```typescript
import type { SnapLine } from "@/application/useSnapLinesStore";

export interface BBox {
  left: number;
  top: number;
  right: number;
  bottom: number;
  centerX: number;
  centerY: number;
}

const SNAP_THRESHOLD = 6; // pixels

export function getBBoxFromElement(el: HTMLElement, canvasEl: HTMLElement): BBox {
  const elRect = el.getBoundingClientRect();
  const canvasRect = canvasEl.getBoundingClientRect();
  return {
    left: elRect.left - canvasRect.left,
    top: elRect.top - canvasRect.top,
    right: elRect.right - canvasRect.left,
    bottom: elRect.bottom - canvasRect.top,
    centerX: elRect.left - canvasRect.left + elRect.width / 2,
    centerY: elRect.top - canvasRect.top + elRect.height / 2,
  };
}

export function computeSnapLines(activeBBox: BBox, otherBBoxes: BBox[]): SnapLine[] {
  const lines: SnapLine[] = [];

  const activeH = [activeBBox.left, activeBBox.centerX, activeBBox.right];
  const activeV = [activeBBox.top, activeBBox.centerY, activeBBox.bottom];

  for (const other of otherBBoxes) {
    const otherH = [other.left, other.centerX, other.right];
    const otherV = [other.top, other.centerY, other.bottom];

    // Vertical lines (X alignment)
    for (const a of activeH) {
      for (const o of otherH) {
        if (Math.abs(a - o) < SNAP_THRESHOLD) {
          lines.push({ type: "vertical", position: o });
        }
      }
    }

    // Horizontal lines (Y alignment)
    for (const a of activeV) {
      for (const o of otherV) {
        if (Math.abs(a - o) < SNAP_THRESHOLD) {
          lines.push({ type: "horizontal", position: o });
        }
      }
    }
  }

  // Deduplicate by type + position
  return lines.filter(
    (line, i, arr) =>
      arr.findIndex((l) => l.type === line.type && Math.abs(l.position - line.position) < 1) === i
  );
}
```

```bash
git add src/application/utils/snapLines.ts
git commit -m "feat: add snapLines utility for bounding box alignment computation"
```

---

### Task 3: Create SnapLinesOverlay component

**Files:**
- Create: `src/components/organisms/Editor/SnapLinesOverlay.tsx`

```tsx
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
```

```bash
git add src/components/organisms/Editor/SnapLinesOverlay.tsx
git commit -m "feat: add SnapLinesOverlay SVG component"
```

---

### Task 4: Add SnapLinesOverlay to Canvas

**Files:**
- Modify: `src/components/organisms/Editor/Canvas.tsx`

**Step 1:** Add imports:
```tsx
import { useRef, useEffect, useState } from "react";
import { SnapLinesOverlay } from "./SnapLinesOverlay";
```

**Step 2:** In `EditorCanvas`, add a ref and dimension state:
```tsx
const canvasRef = useRef<HTMLDivElement>(null);
const [canvasDims, setCanvasDims] = useState({ w: 600, h: 800 });

useEffect(() => {
  const update = () => {
    if (canvasRef.current) {
      setCanvasDims({
        w: canvasRef.current.offsetWidth,
        h: canvasRef.current.offsetHeight,
      });
    }
  };
  update();
  const observer = new ResizeObserver(update);
  if (canvasRef.current) observer.observe(canvasRef.current);
  return () => observer.disconnect();
}, []);
```

**Step 3:** Add `ref={canvasRef}` to the `.email-editor-preview` wrapper div.

**Step 4:** Inside the wrapper, before existing content, add:
```tsx
<SnapLinesOverlay canvasWidth={canvasDims.w} canvasHeight={canvasDims.h} />
```

```bash
git add src/components/organisms/Editor/Canvas.tsx
git commit -m "feat: mount SnapLinesOverlay inside Canvas"
```

---

### Task 5: Add snap line computation to drag handlers

**Files:**
- Modify: `src/app/editor/[id]/page.tsx`

**Step 1:** Add imports:
```tsx
import { useSnapLinesStore } from "@/application/useSnapLinesStore";
import { getBBoxFromElement, computeSnapLines, type BBox } from "@/application/utils/snapLines";
```

**Step 2:** In `handleDragStart`, clear snap lines:
```tsx
useSnapLinesStore.getState().clear();
```

**Step 3:** In `handleDragOver`, after existing logic, compute snap lines:
```tsx
const activeNodeId = event.active.id as string;
const activeEl = document.getElementById(`node-${activeNodeId}`);
const canvasEl = document.querySelector(".email-editor-preview") as HTMLElement | null;

if (activeEl && canvasEl) {
  const activeBBox = getBBoxFromElement(activeEl, canvasEl);
  const otherBBoxes: BBox[] = Object.keys(currentData.nodes)
    .filter((id) => id !== activeNodeId && id !== "root")
    .flatMap((id) => {
      const el = document.getElementById(`node-${id}`);
      return el ? [getBBoxFromElement(el, canvasEl)] : [];
    });
  useSnapLinesStore.getState().setLines(computeSnapLines(activeBBox, otherBBoxes));
}
```

**Step 4:** In `handleDragEnd`, clear snap lines at the start:
```tsx
useSnapLinesStore.getState().clear();
```

Note: This requires each rendered node to have `id={`node-${nodeId}`}` on its outermost DOM element. Verify this exists in Canvas.tsx's `wrapWithSelection` or `NodeRenderer` — add it if missing.

```bash
git add src/app/editor/[id]/page.tsx
git commit -m "feat: compute and display snap lines during drag in editor"
```

---

### Verification
1. `npm run dev` → Open editor → Add 3-4 elements to the canvas
2. Start dragging an existing element
3. When dragging near the edge/center/edge of another element → colored dashed lines should appear
4. Drop the element → snap lines disappear
5. Test performance: with 10+ elements, drag should remain smooth
