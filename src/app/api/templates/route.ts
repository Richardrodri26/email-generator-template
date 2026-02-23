import { NextResponse } from "next/server";
import { MockTemplateRepository } from "@/infrastructure/repositories/MockTemplateRepository";

const repository = new MockTemplateRepository();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const authorId = searchParams.get("authorId");

  if (!authorId) {
    // Return all mocks for demo purposes or empty array
    // Assuming getTemplatesByAuthor("mock-user") returns the mocks
    const templates = await repository.getTemplatesByAuthor("mock-user");
    return NextResponse.json(templates);
  }

  const templates = await repository.getTemplatesByAuthor(authorId);
  return NextResponse.json(templates);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    await repository.saveTemplate(body);
    return NextResponse.json({ success: true, data: body });
  } catch (error) {
    return NextResponse.json({ error: "Failed to save template" }, { status: 500 });
  }
}
