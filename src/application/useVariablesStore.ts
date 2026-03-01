import { create } from "zustand";
import { persist } from "zustand/middleware";

interface VariablesState {
  jsonData: string;
  data: Record<string, string>;
  setJsonData: (json: string) => void;
  previewSubstitution: boolean;
  togglePreviewSubstitution: () => void;
}

export const useVariablesStore = create<VariablesState>()(
  persist(
    (set, get) => ({
      jsonData: "{}",
      data: {},
      previewSubstitution: false,
      setJsonData: (jsonData) => {
        let parsed: Record<string, string> = {};
        try { parsed = JSON.parse(jsonData); } catch {}
        set({ jsonData, data: parsed });
      },
      togglePreviewSubstitution: () =>
        set({ previewSubstitution: !get().previewSubstitution }),
    }),
    { name: "mailgen-variables" }
  )
);
