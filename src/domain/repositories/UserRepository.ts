import { User } from "../models/User";

export interface UserRepository {
  getUserById(id: string): Promise<User | null>;
  getCurrentUser(): Promise<User | null>;
  saveUser(user: User): Promise<void>;
}
