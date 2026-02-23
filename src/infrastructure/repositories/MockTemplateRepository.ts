import { Template } from "@/domain/models/Template";
import { TemplateRepository } from "@/domain/repositories/TemplateRepository";

const MOCK_TEMPLATES: Template[] = [
  {
    id: "mock-1",
    name: "Welcome Email (Mock)",
    authorId: "mock-user",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    data: {
      rootNodeId: "root",
      nodes: {
        root: {
          id: "root",
          type: "ROOT",
          props: {
            style: { backgroundColor: "#f3f4f6", padding: "20px" },
          },
          children: ["text-1"],
        },
        "text-1": {
          id: "text-1",
          type: "TEXT",
          props: {
            text: "Welcome to our service! This is a server-side rendered template.",
            style: { fontSize: "16px", color: "#333" },
          },
          children: [],
        },
      },
    },
  },
  {
    id: "mock-2",
    name: "Newsletter (Mock)",
    authorId: "mock-user",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    data: {
      rootNodeId: "root",
      nodes: {
        root: {
          id: "root",
          type: "ROOT",
          props: {
            style: { backgroundColor: "#ffffff", padding: "20px" },
          },
          children: ["text-2"],
        },
        "text-2": {
          id: "text-2",
          type: "TEXT",
          props: {
            text: "Here is your weekly update.",
            style: { fontSize: "18px", fontWeight: "bold" },
          },
          children: [],
        },
      },
    },
  },
];

export class MockTemplateRepository implements TemplateRepository {
  async getTemplateById(id: string): Promise<Template | null> {
    return MOCK_TEMPLATES.find((t) => t.id === id) || null;
  }

  async getTemplatesByAuthor(authorId: string): Promise<Template[]> {
    // In a real mock, we might filter. For this demo, we return all mocks
    // if the authorId matches "mock-user" or just return all to be visible.
    // Let's return all to ensure something shows up.
    return MOCK_TEMPLATES;
  }

  async saveTemplate(template: Template): Promise<void> {
    // No-op for mock
    console.log("MockRepository: saveTemplate", template);
  }

  async deleteTemplate(id: string): Promise<void> {
    // No-op for mock
    console.log("MockRepository: deleteTemplate", id);
  }
}
