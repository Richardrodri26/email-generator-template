import { NextResponse } from "next/server";
import { MockTemplateRepository } from "@/infrastructure/repositories/MockTemplateRepository";

const repository = new MockTemplateRepository();

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const template = await repository.getTemplateById(id);

  if (!template) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }

  return NextResponse.json(template);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await repository.deleteTemplate(id);
  return NextResponse.json({ success: true, message: `Template ${id} deleted` });
}
