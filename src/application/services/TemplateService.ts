import { Template } from "@/domain/models/Template";
import { TemplateRepository } from "@/domain/repositories/TemplateRepository";
import { v4 as uuidv4 } from "uuid";

export class TemplateService {
  constructor(private repository: TemplateRepository) {}

  async getTemplates(authorId: string): Promise<Template[]> {
    return this.repository.getTemplatesByAuthor(authorId);
  }

  async getTemplateById(id: string): Promise<Template | null> {
    return this.repository.getTemplateById(id);
  }

  async createTemplate(
    name: string,
    authorId: string,
    defaults?: { maxWidth?: string }
  ): Promise<Template> {
    const newTemplate: Template = {
      id: uuidv4(),
      name,
      authorId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      data: {
        rootNodeId: "root",
        nodes: {
          root: {
            id: "root",
            type: "ROOT",
            props: {
              style: {
                backgroundColor: "#ffffff",
                padding: "20px",
                maxWidth: defaults?.maxWidth ?? "600px",
              },
            },
            children: [],
          },
        },
      },
    };

    await this.repository.saveTemplate(newTemplate);
    return newTemplate;
  }

  async deleteTemplate(id: string): Promise<void> {
    return this.repository.deleteTemplate(id);
  }
}
