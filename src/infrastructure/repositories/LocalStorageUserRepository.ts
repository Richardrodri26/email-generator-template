import { User } from "@/domain/models/User";
import { UserRepository } from "@/domain/repositories/UserRepository";

const USERS_STORAGE_KEY = "email_generator_users";
const CURRENT_USER_KEY = "email_generator_current_user";

export class LocalStorageUserRepository implements UserRepository {
  async getUserById(id: string): Promise<User | null> {
    const users = this.getAllUsers();
    return users.find((u) => u.id === id) || null;
  }

  async getCurrentUser(): Promise<User | null> {
    if (typeof window === "undefined") return null;
    const currentUserId = localStorage.getItem(CURRENT_USER_KEY);
    if (!currentUserId) return null;
    return this.getUserById(currentUserId);
  }

  async saveUser(user: User): Promise<void> {
    const users = this.getAllUsers();
    const existingIndex = users.findIndex((u) => u.id === user.id);

    if (existingIndex >= 0) {
      users[existingIndex] = user;
    } else {
      users.push(user);
    }

    if (typeof window !== "undefined") {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    }
  }

  // Helper method to set the mock logged in user
  async setCurrentUser(userId: string): Promise<void> {
    if (typeof window !== "undefined") {
      localStorage.setItem(CURRENT_USER_KEY, userId);
    }
  }

  private getAllUsers(): User[] {
    if (typeof window === "undefined") return [];
    try {
      const data = localStorage.getItem(USERS_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }
}
