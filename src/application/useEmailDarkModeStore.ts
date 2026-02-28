import { create } from "zustand";

interface EmailDarkModeState {
  previewDark: boolean;
  togglePreviewDark: () => void;
}

export const useEmailDarkModeStore = create<EmailDarkModeState>((set, get) => ({
  previewDark: false,
  togglePreviewDark: () => set({ previewDark: !get().previewDark }),
}));
