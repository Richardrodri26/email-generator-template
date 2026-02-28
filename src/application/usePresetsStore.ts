import { create } from "zustand";
import type { ElementPreset } from "@/domain/models/Preset";
import { LocalStoragePresetRepository } from "@/infrastructure/repositories/LocalStoragePresetRepository";

const repo = new LocalStoragePresetRepository();

interface PresetsState {
  presets: ElementPreset[];
  load: () => Promise<void>;
  save: (preset: ElementPreset) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

export const usePresetsStore = create<PresetsState>((set) => ({
  presets: [],
  load: async () => set({ presets: await repo.getAllPresets() }),
  save: async (preset) => {
    await repo.savePreset(preset);
    set({ presets: await repo.getAllPresets() });
  },
  remove: async (id) => {
    await repo.deletePreset(id);
    set({ presets: await repo.getAllPresets() });
  },
}));
