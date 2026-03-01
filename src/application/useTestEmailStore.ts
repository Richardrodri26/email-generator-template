import { create } from "zustand";
import { persist } from "zustand/middleware";

interface TestEmailState {
  resendApiKey: string;
  setResendApiKey: (key: string) => void;
}

export const useTestEmailStore = create<TestEmailState>()(
  persist(
    (set) => ({
      resendApiKey: "",
      setResendApiKey: (resendApiKey) => set({ resendApiKey }),
    }),
    { name: "mailgen-test-email" }
  )
);
