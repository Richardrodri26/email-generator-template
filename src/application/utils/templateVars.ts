import type { TemplateData } from "@/domain/models/Template";

export function extractVars(text: string): string[] {
  const matches = text.matchAll(/\{\{(\w+)\}\}/g);
  return [...new Set([...matches].map((m) => m[1]))];
}

export function substituteVars(text: string, data: Record<string, string>): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_, key) => data[key] ?? `{{${key}}}`);
}

export function extractAllVars(templateData: TemplateData): string[] {
  const vars = new Set<string>();
  for (const node of Object.values(templateData.nodes)) {
    if (node.props.content) {
      extractVars(String(node.props.content)).forEach((v) => vars.add(v));
    }
    if (node.props.text) {
      extractVars(String(node.props.text)).forEach((v) => vars.add(v));
    }
  }
  return [...vars];
}

export function substituteAllNodes(
  data: TemplateData,
  vars: Record<string, string>
): TemplateData {
  const cloned: TemplateData = JSON.parse(JSON.stringify(data));
  for (const node of Object.values(cloned.nodes)) {
    if (node.props.content) {
      node.props.content = substituteVars(String(node.props.content), vars);
    }
    if (node.props.text) {
      node.props.text = substituteVars(String(node.props.text), vars);
    }
  }
  return cloned;
}
