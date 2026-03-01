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
