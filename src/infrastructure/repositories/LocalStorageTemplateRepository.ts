import { Template } from "@/domain/models/Template";
import { TemplateRepository } from "@/domain/repositories/TemplateRepository";

const TEMPLATES_STORAGE_KEY = "email_generator_templates";

export class LocalStorageTemplateRepository implements TemplateRepository {
  async getTemplateById(id: string): Promise<Template | null> {
    const templates = this.getAllTemplates();
    return templates.find((t) => t.id === id) || null;
  }

  async getTemplatesByAuthor(authorId: string): Promise<Template[]> {
    const templates = this.getAllTemplates();
    return templates.filter((t) => t.authorId === authorId);
  }

  async saveTemplate(template: Template): Promise<void> {
    const templates = this.getAllTemplates();
    const existingIndex = templates.findIndex((t) => t.id === template.id);

    template.updatedAt = new Date().toISOString();

    if (existingIndex >= 0) {
      templates[existingIndex] = template;
    } else {
      templates.push(template);
    }

    if (typeof window !== "undefined") {
      localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(templates));
    }
  }

  async deleteTemplate(id: string): Promise<void> {
    const templates = this.getAllTemplates();
    const updatedTemplates = templates.filter((t) => t.id !== id);
    if (typeof window !== "undefined") {
      localStorage.setItem(
        TEMPLATES_STORAGE_KEY,
        JSON.stringify(updatedTemplates),
      );
    }
  }

  private getAllTemplates(): Template[] {
    if (typeof window === "undefined") return [];
    try {
      const data = localStorage.getItem(TEMPLATES_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }
}
