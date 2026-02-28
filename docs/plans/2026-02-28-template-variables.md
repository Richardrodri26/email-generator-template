# Template Variables — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Detect `{{variableName}}` in text content. Show Variables panel in Sidebar. JSON data input for preview values. Export as template (raw) OR rendered (substituted).

**Architecture:** `useVariablesStore` (Zustand + persist) holds JSON data string. `templateVars.ts` utility extracts/substitutes vars. Sidebar converts to 2-tab layout (Blocks | Variables). Canvas TEXT node previews substituted content when enabled. Two export buttons: "Export Template" and "Export Rendered".

**Tech Stack:** Zustand + persist, Shadcn Tabs + Switch

---

### Task 1: Create templateVars utility

**Files:**
- Create: `src/application/utils/templateVars.ts`

```typescript
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
```

```bash
git add src/application/utils/templateVars.ts
git commit -m "feat: add templateVars utility for {{variable}} extraction and substitution"
```

---

### Task 2: Create useVariablesStore

**Files:**
- Create: `src/application/useVariablesStore.ts`

```typescript
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface VariablesState {
  jsonData: string;
  data: Record<string, string>;
  setJsonData: (json: string) => void;
  previewSubstitution: boolean;
  togglePreviewSubstitution: () => void;
}

export const useVariablesStore = create<VariablesState>()(
  persist(
    (set, get) => ({
      jsonData: "{}",
      data: {},
      previewSubstitution: false,
      setJsonData: (jsonData) => {
        let parsed: Record<string, string> = {};
        try { parsed = JSON.parse(jsonData); } catch {}
        set({ jsonData, data: parsed });
      },
      togglePreviewSubstitution: () =>
        set({ previewSubstitution: !get().previewSubstitution }),
    }),
    { name: "mailgen-variables" }
  )
);
```

```bash
git add src/application/useVariablesStore.ts
git commit -m "feat: add useVariablesStore for template variable data"
```

---

### Task 3: Update Canvas to substitute variables in preview

**Files:**
- Modify: `src/components/organisms/Editor/Canvas.tsx`

**Step 1:** Add imports:
```tsx
import { useVariablesStore } from "@/application/useVariablesStore";
import { substituteVars } from "@/application/utils/templateVars";
```

**Step 2:** In the TEXT case of NodeRenderer, use substituted content:
```tsx
const { previewSubstitution, data: varData } = useVariablesStore();
const displayContent = previewSubstitution
  ? substituteVars(node.props.content || "", varData)
  : node.props.content;
// Use displayContent instead of node.props.content in the rendered text
```

```bash
git add src/components/organisms/Editor/Canvas.tsx
git commit -m "feat: Canvas TEXT node shows substituted variables when preview enabled"
```

---

### Task 4: Create VariablesPanel component

**Files:**
- Create: `src/components/organisms/Editor/VariablesPanel.tsx`

Install required Shadcn components: `npx shadcn add switch`

```tsx
"use client";
import { useEditorStore } from "@/application/useEditorStore";
import { useVariablesStore } from "@/application/useVariablesStore";
import { extractAllVars } from "@/application/utils/templateVars";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export function VariablesPanel() {
  const data = useEditorStore((s) => s.data);
  const { jsonData, setJsonData, previewSubstitution, togglePreviewSubstitution } = useVariablesStore();
  const vars = extractAllVars(data);

  return (
    <div className="p-4 space-y-4 flex-1 overflow-y-auto">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Detected Variables
        </h3>
        <div className="flex items-center gap-2">
          <Label className="text-xs">Preview</Label>
          <Switch checked={previewSubstitution} onCheckedChange={togglePreviewSubstitution} />
        </div>
      </div>

      {vars.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          Add {`{{variableName}}`} in any Text element to detect variables here.
        </p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {vars.map((v) => (
            <span key={v} className="font-mono text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-md border border-primary/20">
              {`{{${v}}}`}
            </span>
          ))}
        </div>
      )}

      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">JSON Preview Data</Label>
        <textarea
          className="w-full h-40 p-3 text-xs font-mono border border-input rounded-md bg-muted/50 focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          value={jsonData}
          onChange={(e) => setJsonData(e.target.value)}
          placeholder={'{\n  "firstName": "John",\n  "product": "Pro Plan"\n}'}
        />
      </div>
    </div>
  );
}
```

```bash
git add src/components/organisms/Editor/VariablesPanel.tsx
git commit -m "feat: add VariablesPanel with detected vars list and JSON data input"
```

---

### Task 5: Convert Sidebar to tabbed layout

**Files:**
- Modify: `src/components/organisms/Editor/Sidebar.tsx`

Install: `npx shadcn add tabs`

**Step 1:** Add imports:
```tsx
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { VariablesPanel } from "./VariablesPanel";
import { Code2, LayoutGrid } from "lucide-react";
```

**Step 2:** Wrap the existing blocks content in a `TabsContent` and add a Variables tab:
```tsx
<Tabs defaultValue="blocks" className="flex flex-col flex-1 overflow-hidden">
  <TabsList className="mx-4 mt-3 grid w-auto grid-cols-2">
    <TabsTrigger value="blocks" className="text-xs">
      <LayoutGrid className="h-3.5 w-3.5 mr-1.5" /> Blocks
    </TabsTrigger>
    <TabsTrigger value="variables" className="text-xs">
      <Code2 className="h-3.5 w-3.5 mr-1.5" /> Variables
    </TabsTrigger>
  </TabsList>

  <TabsContent value="blocks" className="flex-1 overflow-y-auto mt-0">
    {/* Existing header + blocks grid + presets section */}
  </TabsContent>

  <TabsContent value="variables" className="flex-1 overflow-hidden mt-0">
    <VariablesPanel />
  </TabsContent>
</Tabs>
```

```bash
git add src/components/organisms/Editor/Sidebar.tsx
git commit -m "feat: convert Sidebar to tabbed layout with Blocks and Variables tabs"
```

---

### Task 6: Add "Export Rendered" button to editor toolbar

**Files:**
- Modify: `src/app/editor/[id]/page.tsx`

**Step 1:** Add imports:
```tsx
import { useVariablesStore } from "@/application/useVariablesStore";
import { substituteAllNodes } from "@/application/utils/templateVars";
```

**Step 2:** Add rendered export handler:
```tsx
const { data: varData } = useVariablesStore();

const handleExportRendered = async () => {
  const renderedData = substituteAllNodes(currentData, varData);
  const htmlString = await generateHtmlExport(renderedData, themeCSS);
  const blob = new Blob([htmlString], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `template-${id}-rendered.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
```

**Step 3:** Add button next to "Export HTML":
```tsx
<Button size="sm" variant="outline" onClick={handleExportRendered}>
  Export Rendered
</Button>
```

Rename the existing export button to "Export Template" for clarity.

```bash
git add src/app/editor/[id]/page.tsx
git commit -m "feat: add Export Rendered button that applies variable substitution before HTML export"
```

---

### Verification
1. `npm run dev` → Add a TEXT block, type `Hello {{firstName}}!`
2. Sidebar → Variables tab → `{{firstName}}` detected
3. Enter JSON: `{"firstName": "John"}` → toggle Preview → canvas shows "Hello John!"
4. Toggle Preview off → shows raw `{{firstName}}`
5. Export Rendered → download HTML → open in browser → "Hello John!"
6. Export Template → download HTML → contains `{{firstName}}` unchanged
