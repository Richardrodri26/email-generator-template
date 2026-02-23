import { Theme } from "@/domain/models/Theme";
import { ThemeRepository } from "@/domain/repositories/ThemeRepository";

const THEMES_STORAGE_KEY = "email_generator_themes";

export class LocalStorageThemeRepository implements ThemeRepository {
  async getThemeById(id: string): Promise<Theme | null> {
    const themes = this.getAllThemes();
    return themes.find((t) => t.id === id) || null;
  }

  async getThemesByAuthor(authorId: string): Promise<Theme[]> {
    const themes = this.getAllThemes();
    return themes.filter((t) => t.authorId === authorId);
  }

  async getDefaultTheme(): Promise<Theme | null> {
    const themes = this.getAllThemes();
    return themes.find((t) => t.isDefault) || null;
  }

  async saveTheme(theme: Theme): Promise<void> {
    const themes = this.getAllThemes();

    // If setting as default, unset others for this user/overall
    if (theme.isDefault) {
      themes.forEach((t) => {
        if (t.authorId === theme.authorId) {
          t.isDefault = false;
        }
      });
    }

    const existingIndex = themes.findIndex((t) => t.id === theme.id);
    theme.updatedAt = new Date().toISOString();

    if (existingIndex >= 0) {
      themes[existingIndex] = theme;
    } else {
      themes.push(theme);
    }

    if (typeof window !== "undefined") {
      localStorage.setItem(THEMES_STORAGE_KEY, JSON.stringify(themes));
    }
  }

  async deleteTheme(id: string): Promise<void> {
    const themes = this.getAllThemes();
    const updatedThemes = themes.filter((t) => t.id !== id);
    if (typeof window !== "undefined") {
      localStorage.setItem(THEMES_STORAGE_KEY, JSON.stringify(updatedThemes));
    }
  }

  private getAllThemes(): Theme[] {
    if (typeof window === "undefined") return [];
    try {
      const data = localStorage.getItem(THEMES_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }
}
