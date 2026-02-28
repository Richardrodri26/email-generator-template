import type { ElementPreset } from "../models/Preset";

export interface PresetRepository {
  getAllPresets(): Promise<ElementPreset[]>;
  savePreset(preset: ElementPreset): Promise<void>;
  deletePreset(id: string): Promise<void>;
}
