# Email Dark Mode — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** (1) Preview toggle to simulate dark-mode email clients. (2) Export HTML includes `@media (prefers-color-scheme: dark)` with per-element dark color overrides.

**Architecture:** `darkStyle` is a free-form key in `node.props` (no domain type change needed — `props: Record<string, any>` already supports it). `useEmailDarkModeStore` tracks preview state. PropertiesPanel adds Dark Mode Colors section. Canvas merges darkStyle when preview enabled. Export builder collects darkStyle values and emits a `@media` CSS block.

**Tech Stack:** React 19, Zustand, Shadcn Switch

---

### Task 1: Create useEmailDarkModeStore

**Files:**
- Create: `src/application/useEmailDarkModeStore.ts`

```typescript
import { create } from "zustand";

interface EmailDarkModeState {
  previewDark: boolean;
  togglePreviewDark: () => void;
}

export const useEmailDarkModeStore = create<EmailDarkModeState>((set, get) => ({
  previewDark: false,
  togglePreviewDark: () => set({ previewDark: !get().previewDark }),
}));
```

```bash
git add src/application/useEmailDarkModeStore.ts
git commit -m "feat: add useEmailDarkModeStore for email dark mode preview"
```

---

### Task 2: Add Dark Mode Colors section to PropertiesPanel

**Files:**
- Modify: `src/components/organisms/Editor/PropertiesPanel.tsx`

**Step 1:** Import Switch if not already added: `import { Switch } from "@/components/ui/switch";`

**Step 2:** Add Dark Mode Colors section at the bottom of TEXT, BUTTON, CONTAINER, and CARD sections. Example for TEXT:

```tsx
{/* After the main color controls for TEXT: */}
<div className="space-y-3 border-t border-border pt-3">
  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
    Dark Mode Colors
  </h3>

  {/* Dark Background Color */}
  <div>
    <Label className="text-xs text-muted-foreground mb-1 block">Dark Background</Label>
    <div className="flex gap-2">
      <Input
        type="color"
        value={node.props.darkStyle?.backgroundColor || "#1a1a1a"}
        onChange={(e) => updateNodeProps(node.id, {
          darkStyle: { ...node.props.darkStyle, backgroundColor: e.target.value }
        })}
        className="w-12 p-1 h-9"
      />
      <Input
        type="text"
        value={node.props.darkStyle?.backgroundColor || ""}
        onChange={(e) => updateNodeProps(node.id, {
          darkStyle: { ...node.props.darkStyle, backgroundColor: e.target.value }
        })}
        placeholder="#1a1a1a"
        className="flex-1 font-mono text-sm"
      />
    </div>
  </div>

  {/* Dark Text Color */}
  <div>
    <Label className="text-xs text-muted-foreground mb-1 block">Dark Text Color</Label>
    <div className="flex gap-2">
      <Input
        type="color"
        value={node.props.darkStyle?.color || "#ffffff"}
        onChange={(e) => updateNodeProps(node.id, {
          darkStyle: { ...node.props.darkStyle, color: e.target.value }
        })}
        className="w-12 p-1 h-9"
      />
      <Input
        type="text"
        value={node.props.darkStyle?.color || ""}
        onChange={(e) => updateNodeProps(node.id, {
          darkStyle: { ...node.props.darkStyle, color: e.target.value }
        })}
        placeholder="#ffffff"
        className="flex-1 font-mono text-sm"
      />
    </div>
  </div>
</div>
```

Replicate similarly for BUTTON (bg + text), CONTAINER (bg), CARD (bg).

```bash
git add src/components/organisms/Editor/PropertiesPanel.tsx
git commit -m "feat: add Dark Mode Colors section to PropertiesPanel for TEXT/BUTTON/CONTAINER/CARD"
```

---

### Task 3: Update Canvas to apply dark preview

**Files:**
- Modify: `src/components/organisms/Editor/Canvas.tsx`

**Step 1:** Add import:
```tsx
import { useEmailDarkModeStore } from "@/application/useEmailDarkModeStore";
```

**Step 2:** In `NodeRenderer`, read dark preview state and merge darkStyle:
```tsx
const { previewDark } = useEmailDarkModeStore();

// In the merged style computation, after spreading node.props.style:
const merged = {
  ...node.props.style,
  ...(previewDark && node.props.darkStyle ? node.props.darkStyle : {}),
  ...localSize,
};
```

**Step 3:** Apply dark background to the canvas wrapper when `previewDark` is true:
```tsx
<div
  style={{
    maxWidth: previewWidth,
    transition: "max-width 300ms ease",
    backgroundColor: previewDark ? "#1a1a1a" : undefined,
  }}
  className="w-full ..."
>
```

```bash
git add src/components/organisms/Editor/Canvas.tsx
git commit -m "feat: Canvas applies darkStyle overrides when email dark mode preview enabled"
```

---

### Task 4: Add dark mode toggle to editor toolbar

**Files:**
- Modify: `src/app/editor/[id]/page.tsx`

**Step 1:** Add import:
```tsx
import { useEmailDarkModeStore } from "@/application/useEmailDarkModeStore";
import { Moon } from "lucide-react";
```

**Step 2:** In component body:
```tsx
const { previewDark, togglePreviewDark } = useEmailDarkModeStore();
```

**Step 3:** Add button in toolbar:
```tsx
<Button
  size="sm"
  variant={previewDark ? "default" : "outline"}
  onClick={togglePreviewDark}
  title="Toggle email dark mode preview"
>
  <Moon className="h-4 w-4 mr-2" />
  {previewDark ? "Dark" : "Light"}
</Button>
```

```bash
git add src/app/editor/[id]/page.tsx
git commit -m "feat: add email dark mode preview toggle to editor toolbar"
```

---

### Task 5: Update export pipeline to emit @media dark CSS

**Files:**
- Modify: `src/application/useExportBuilder.tsx`

**Step 1:** Add helper function before `generateReactEmailElement`:

```typescript
function buildDarkMediaCSS(data: TemplateData): string {
  const rules: string[] = [];
  for (const node of Object.values(data.nodes)) {
    if (node.props.darkStyle && Object.keys(node.props.darkStyle).length > 0) {
      const styleStr = Object.entries(node.props.darkStyle as Record<string, string>)
        .map(([k, v]) => `${k.replace(/([A-Z])/g, "-$1").toLowerCase()}: ${v}`)
        .join("; ");
      rules.push(`  [data-node-id="${node.id}"] { ${styleStr} }`);
    }
  }
  if (rules.length === 0) return "";
  return `@media (prefers-color-scheme: dark) {\n${rules.join("\n")}\n}`;
}
```

**Step 2:** In `renderNode`, add `data-node-id={node.id}` to each node's outermost element. For example, for TEXT:
```tsx
<Text key={node.id} data-node-id={node.id} style={node.props.style}>
  {node.props.content}
</Text>
```
Do this for all node types.

**Step 3:** In `generateReactEmailElement`, inject the dark CSS into the `<Head>`:
```tsx
const darkCSS = buildDarkMediaCSS(data);

return (
  <Html>
    <Head>
      {darkCSS && <style>{darkCSS}</style>}
      ...
    </Head>
    ...
  </Html>
);
```

```bash
git add src/application/useExportBuilder.tsx
git commit -m "feat: export HTML includes @media prefers-color-scheme dark CSS from darkStyle props"
```

---

### Verification
1. `npm run dev` → Select a TEXT node → set Dark Background to `#111111`, Dark Text to `#ffffff`
2. Click the Moon toggle in toolbar → canvas background goes dark, node colors update
3. Toggle back → returns to light mode
4. Click "Export HTML" → open HTML in browser → simulate dark mode with browser devtools (Rendering tab → Emulate CSS media feature prefers-color-scheme: dark) → colors should update
