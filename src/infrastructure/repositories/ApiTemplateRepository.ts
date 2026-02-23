import { Template } from "@/domain/models/Template";
import { TemplateRepository } from "@/domain/repositories/TemplateRepository";

export class ApiTemplateRepository implements TemplateRepository {
  private baseUrl = "/api/templates";

  async getTemplateById(id: string): Promise<Template | null> {
    const res = await fetch(`${this.baseUrl}/${id}`);
    if (!res.ok) return null;
    return res.json();
  }

  async getTemplatesByAuthor(authorId: string): Promise<Template[]> {
    const res = await fetch(`${this.baseUrl}?authorId=${encodeURIComponent(authorId)}`);
    if (!res.ok) return [];
    return res.json();
  }

  async saveTemplate(template: Template): Promise<void> {
    await fetch(this.baseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(template),
    });
  }

  async deleteTemplate(id: string): Promise<void> {
    await fetch(`${this.baseUrl}/${id}`, {
      method: "DELETE",
    });
  }
}
