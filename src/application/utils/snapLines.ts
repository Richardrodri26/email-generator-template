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
