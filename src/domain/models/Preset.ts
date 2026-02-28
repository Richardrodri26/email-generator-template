import type { EditorNodeType } from "./Template";

export interface ElementPreset {
  id: string;
  name: string;
  nodeType: EditorNodeType;
  props: Record<string, any>;
  createdAt: string;
}
