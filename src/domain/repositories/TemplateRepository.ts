import { Template } from "../models/Template";

export interface TemplateRepository {
  getTemplateById(id: string): Promise<Template | null>;
  getTemplatesByAuthor(authorId: string): Promise<Template[]>;
  saveTemplate(template: Template): Promise<void>;
  deleteTemplate(id: string): Promise<void>;
}
