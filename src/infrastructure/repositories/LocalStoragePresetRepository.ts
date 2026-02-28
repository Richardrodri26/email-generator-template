import type { ElementPreset } from "@/domain/models/Preset";
import type { PresetRepository } from "@/domain/repositories/PresetRepository";

const KEY = "mailgen_element_presets";

export class LocalStoragePresetRepository implements PresetRepository {
  async getAllPresets(): Promise<ElementPreset[]> {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  }

  async savePreset(preset: ElementPreset): Promise<void> {
    const all = await this.getAllPresets();
    const idx = all.findIndex((p) => p.id === preset.id);
    if (idx >= 0) all[idx] = preset; else all.push(preset);
    localStorage.setItem(KEY, JSON.stringify(all));
  }

  async deletePreset(id: string): Promise<void> {
    const all = await this.getAllPresets();
    localStorage.setItem(KEY, JSON.stringify(all.filter((p) => p.id !== id)));
  }
}
