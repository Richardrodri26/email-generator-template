# Variables v2 — Per-Field Inputs & Type System — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the raw JSON textarea in the Variables panel with individual labeled input fields — one per detected `{{variable}}`. Add a variable type selector (text, number, date) that validates input and formats the preview value accordingly. Show a live "Variables detected" count badge in the Sidebar tab.

**Architecture:** `useVariablesStore` already persists `data: Record<string, string>`. We extend it with `types: Record<string, VariableType>`. `extractAllVars` from `templateVars.ts` already scans the tree. The new `VariableField` component renders a labeled input + type select per var. The Sidebar tab label gets a count badge via `useVariablesStore`.

**Tech Stack:** Zustand, Shadcn Input + Select + Badge + Label, existing `templateVars.ts` utility, `useEditorStore`

> **Note:** The basic Variables feature is already implemented. This plan adds per-field UX on top without breaking existing behavior.

---

### Task 1: Extend VariablesStore with types

**Files:**
- Modify: `src/application/useVariablesStore.ts`

**Step 1: Read the current store to understand its shape**

**Step 2: Add `VariableType` and extend the state**

```typescript
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type VariableType = "text" | "number" | "date";

interface VariablesState {
  data: Record<string, string>;
  types: Record<string, VariableType>;          // NEW
  previewSubstitution: boolean;
  // Keep jsonData for backwards compatibility with existing persist key
  jsonData: string;
  setJsonData: (json: string) => void;
  setFieldValue: (key: string, value: string) => void;   // NEW
  setFieldType: (key: string, type: VariableType) => void; // NEW
  togglePreviewSubstitution: () => void;
}

export const useVariablesStore = create<VariablesState>()(
  persist(
    (set, get) => ({
      jsonData: "{}",
      data: {},
      types: {},
      previewSubstitution: false,

      setJsonData: (jsonData) => {
        let parsed: Record<string, string> = {};
        try { parsed = JSON.parse(jsonData); } catch {}
        set({ jsonData, data: parsed });
      },

      setFieldValue: (key, value) => {
        const data = { ...get().data, [key]: value };
        set({ data, jsonData: JSON.stringify(data, null, 2) });
      },

      setFieldType: (key, type) => {
        set((s) => ({ types: { ...s.types, [key]: type } }));
      },

      togglePreviewSubstitution: () =>
        set({ previewSubstitution: !get().previewSubstitution }),
    }),
    { name: "mailgen-variables" }
  )
);
```

---

### Task 2: Create VariableField component

**Files:**
- Create: `src/components/organisms/Editor/VariableField.tsx`

```tsx
"use client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { VariableType } from "@/application/useVariablesStore";

interface Props {
  varName: string;
  value: string;
  type: VariableType;
  onValueChange: (value: string) => void;
  onTypeChange: (type: VariableType) => void;
}

const INPUT_TYPE_MAP: Record<VariableType, string> = {
  text: "text",
  number: "number",
  date: "date",
};

export function VariableField({
  varName,
  value,
  type,
  onValueChange,
  onTypeChange,
}: Props) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-mono text-muted-foreground">
          {`{{${varName}}}`}
        </Label>
        <Select
          value={type}
          onValueChange={(v) => onTypeChange(v as VariableType)}
        >
          <SelectTrigger className="h-6 w-24 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="text">Text</SelectItem>
            <SelectItem value="number">Number</SelectItem>
            <SelectItem value="date">Date</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Input
        type={INPUT_TYPE_MAP[type]}
        value={value}
        placeholder={`Enter ${varName}...`}
        className="h-8 text-sm"
        onChange={(e) => onValueChange(e.target.value)}
      />
    </div>
  );
}
```

> Requires: `npx shadcn add select` if not present.

---

### Task 3: Rewrite VariablesPanel to use per-field inputs

**Files:**
- Modify: `src/components/organisms/Editor/VariablesPanel.tsx`

**Step 1: Read the current VariablesPanel to understand what's there**

**Step 2: Replace with the new implementation**

```tsx
"use client";
import { useVariablesStore } from "@/application/useVariablesStore";
import { useEditorStore } from "@/application/useEditorStore";
import { extractAllVars } from "@/application/utils/templateVars";
import { VariableField } from "./VariableField";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";

export function VariablesPanel() {
  const { data, types, previewSubstitution, setFieldValue, setFieldType, togglePreviewSubstitution } =
    useVariablesStore();

  // Get detected variables from the current editor tree
  const templateData = useEditorStore((s) => s.present); // adapt to actual field name
  const detectedVars = extractAllVars(templateData);

  return (
    <div className="flex flex-col h-full">
      {/* Preview toggle */}
      <div className="flex items-center justify-between p-3 border-b">
        <Label className="text-sm">Preview with values</Label>
        <Switch
          checked={previewSubstitution}
          onCheckedChange={togglePreviewSubstitution}
        />
      </div>

      {detectedVars.length === 0 ? (
        <p className="p-4 text-sm text-muted-foreground">
          No variables detected. Use <code className="text-xs bg-muted px-1 rounded">{"{{variableName}}"}</code> in any text node.
        </p>
      ) : (
        <ScrollArea className="flex-1">
          <div className="p-3 space-y-4">
            {detectedVars.map((varName) => (
              <VariableField
                key={varName}
                varName={varName}
                value={data[varName] ?? ""}
                type={types[varName] ?? "text"}
                onValueChange={(v) => setFieldValue(varName, v)}
                onTypeChange={(t) => setFieldType(varName, t)}
              />
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
```

---

### Task 4: Add variable count badge to Sidebar tab

**Files:**
- Modify: `src/components/organisms/Editor/Sidebar.tsx`

**Step 1: Read the current Sidebar to find the Variables tab trigger**

**Step 2: Pull the detected var count and show a Badge**

```tsx
import { useVariablesStore } from "@/application/useVariablesStore";
import { useEditorStore } from "@/application/useEditorStore";
import { extractAllVars } from "@/application/utils/templateVars";
import { Badge } from "@/components/ui/badge";

// Inside the component:
const templateData = useEditorStore((s) => s.present);
const varCount = extractAllVars(templateData).length;

// On the Variables tab trigger:
<TabsTrigger value="variables" className="relative">
  Variables
  {varCount > 0 && (
    <Badge
      variant="secondary"
      className="ml-1.5 h-4 min-w-4 px-1 text-[10px]"
    >
      {varCount}
    </Badge>
  )}
</TabsTrigger>
```

---

### Task 5: Validate date formatting in substituteVars

**Files:**
- Modify: `src/application/utils/templateVars.ts`

**Step 1: Read the current substituteVars implementation**

**Step 2: Accept types map and format accordingly**

```typescript
export function substituteVarsTyped(
  text: string,
  data: Record<string, string>,
  types: Record<string, import("@/application/useVariablesStore").VariableType>
): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const raw = data[key];
    if (raw === undefined || raw === "") return `{{${key}}}`;
    const type = types[key] ?? "text";
    if (type === "date" && raw) {
      try {
        return new Intl.DateTimeFormat("en-US", { dateStyle: "long" }).format(new Date(raw));
      } catch {
        return raw;
      }
    }
    return raw;
  });
}
```

**Step 3: Update Canvas.tsx TEXT node to use `substituteVarsTyped` instead of `substituteVars` when `previewSubstitution` is true**

Read Canvas.tsx first to find where variables are applied, then update the import and call.

---

### Task 6: Manual test

**Step 1:** `npm run dev` → open a template with `{{name}}`, `{{amount}}`, `{{date}}`

**Step 2:** Open the Variables tab → three labeled inputs appear

**Step 3:** Change type of `amount` to "number" → input only accepts numbers

**Step 4:** Change type of `date` to "date" → date picker appears

**Step 5:** Toggle "Preview with values" → canvas shows substituted values

**Step 6:** Check the Sidebar tab → badge shows "3"

---

### Task 7: Commit

```bash
git add src/application/useVariablesStore.ts \
        src/application/utils/templateVars.ts \
        src/components/organisms/Editor/VariablesPanel.tsx \
        src/components/organisms/Editor/VariableField.tsx \
        src/components/organisms/Editor/Sidebar.tsx \
        src/components/organisms/Editor/Canvas.tsx
git commit -m "feat: variables v2 - per-field inputs with type system and count badge"
```
