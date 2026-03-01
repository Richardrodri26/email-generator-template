import { create } from "zustand";

export type PreviewDevice = "desktop" | "tablet" | "mobile";

interface PreviewState {
  device: PreviewDevice;
  setDevice: (d: PreviewDevice) => void;
  modalOpen: boolean;
  setModalOpen: (open: boolean) => void;
}

export const DEVICE_WIDTHS: Record<PreviewDevice, number> = {
  desktop: 600,
  tablet: 480,
  mobile: 375,
};

export const usePreviewStore = create<PreviewState>((set) => ({
  device: "desktop",
  setDevice: (device) => set({ device }),
  modalOpen: false,
  setModalOpen: (modalOpen) => set({ modalOpen }),
}));
