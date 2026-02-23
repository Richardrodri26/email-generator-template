export type EditorNodeType =
  | "ROOT"
  | "TEXT"
  | "BUTTON"
  | "IMAGE"
  | "CONTAINER"
  | "DIVIDER"
  | "SPACER"
  | "COLUMNS"
  | "SOCIAL"
  | "CARD"
  | "TABLE";

export interface EditorNode {
  id: string;
  type: EditorNodeType;
  props: Record<string, any>; // Used for styling or text content
  children: string[]; // IDs of child nodes
}

export interface TemplateData {
  rootNodeId: string;
  nodes: Record<string, EditorNode>;
}

export interface Template {
  id: string;
  name: string;
  description?: string;
  authorId: string;
  createdAt: string;
  updatedAt: string;
  // This JSON contains the state of the editor for this template
  data: TemplateData;
  // For quick rendering or displaying the final built HTML preview
  htmlPreview?: string;
}
