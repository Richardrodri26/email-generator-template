import { create } from "zustand";
import { User } from "@/domain/models/User";
import { LocalStorageUserRepository } from "@/infrastructure/repositories/LocalStorageUserRepository";

interface AuthState {
  user: User | null;
  isLoading: boolean;
  login: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const userRepository = new LocalStorageUserRepository();

export const useAuth = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  login: async (email: string) => {
    set({ isLoading: true });
    // In a real app we'd verify passwords. Here we just mock it.
    // If the user doesn't exist, we create them instantly for demo purposes.
    const mockId = `mock-id-${email}`;
    let user = await userRepository.getUserById(mockId);

    if (!user) {
      user = {
        id: mockId,
        email,
        name: email.split("@")[0], // derived name
        role: email.includes("admin") ? "ADMIN" : "USER",
        createdAt: new Date().toISOString(),
      };
      await userRepository.saveUser(user);
    }

    await userRepository.setCurrentUser(user.id);
    set({ user, isLoading: false });
  },
  logout: async () => {
    set({ isLoading: true });
    await userRepository.setCurrentUser("");
    set({ user: null, isLoading: false });
  },
  checkAuth: async () => {
    set({ isLoading: true });
    const user = await userRepository.getCurrentUser();
    set({ user, isLoading: false });
  },
}));
