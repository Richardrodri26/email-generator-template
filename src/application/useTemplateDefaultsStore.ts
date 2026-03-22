import { create } from "zustand";
import { persist } from "zustand/middleware";

interface TemplateDefaultsState {
  defaultMaxWidth: string;
  setDefaultMaxWidth: (width: string) => void;
}

export const useTemplateDefaultsStore = create<TemplateDefaultsState>()(
  persist(
    (set) => ({
      defaultMaxWidth: "600px",
      setDefaultMaxWidth: (width) => set({ defaultMaxWidth: width }),
    }),
    { name: "mailgen_template_defaults" }
  )
);
