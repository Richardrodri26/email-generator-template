import { Theme } from "../models/Theme";

export interface ThemeRepository {
  getThemeById(id: string): Promise<Theme | null>;
  getThemesByAuthor(authorId: string): Promise<Theme[]>;
  getDefaultTheme(): Promise<Theme | null>;
  saveTheme(theme: Theme): Promise<void>;
  deleteTheme(id: string): Promise<void>;
}
