# Element Presets — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Save any styled element as a named preset to localStorage. Show "My Presets" in the Sidebar. Drag presets to canvas like regular blocks.

**Architecture:** New domain model `ElementPreset` + `PresetRepository` interface. `LocalStoragePresetRepository` implements it. `usePresetsStore` (Zustand) exposes CRUD. PropertiesPanel header gets "Save as Preset" button. Sidebar gets a collapsible "My Presets" section with `DraggablePresetBlock` components.

**Tech Stack:** React 19, Zustand, dnd-kit (useDraggable), localStorage

---

### Task 1: Create domain model and repository interface

**Files:**
- Create: `src/domain/models/Preset.ts`
- Create: `src/domain/repositories/PresetRepository.ts`

```typescript
// src/domain/models/Preset.ts
import type { EditorNodeType } from "./Template";

export interface ElementPreset {
  id: string;
  name: string;
  nodeType: EditorNodeType;
  props: Record<string, any>;
  createdAt: string;
}
```

```typescript
// src/domain/repositories/PresetRepository.ts
import type { ElementPreset } from "../models/Preset";

export interface PresetRepository {
  getAllPresets(): Promise<ElementPreset[]>;
  savePreset(preset: ElementPreset): Promise<void>;
  deletePreset(id: string): Promise<void>;
}
```

```bash
git add src/domain/models/Preset.ts src/domain/repositories/PresetRepository.ts
git commit -m "feat: add ElementPreset domain model and PresetRepository interface"
```

---

### Task 2: Create localStorage implementation

**Files:**
- Create: `src/infrastructure/repositories/LocalStoragePresetRepository.ts`

```typescript
import type { ElementPreset } from "@/domain/models/Preset";
import type { PresetRepository } from "@/domain/repositories/PresetRepository";

const KEY = "mailgen_element_presets";

export class LocalStoragePresetRepository implements PresetRepository {
  async getAllPresets(): Promise<ElementPreset[]> {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  }

  async savePreset(preset: ElementPreset): Promise<void> {
    const all = await this.getAllPresets();
    const idx = all.findIndex((p) => p.id === preset.id);
    if (idx >= 0) all[idx] = preset; else all.push(preset);
    localStorage.setItem(KEY, JSON.stringify(all));
  }

  async deletePreset(id: string): Promise<void> {
    const all = await this.getAllPresets();
    localStorage.setItem(KEY, JSON.stringify(all.filter((p) => p.id !== id)));
  }
}
```

```bash
git add src/infrastructure/repositories/LocalStoragePresetRepository.ts
git commit -m "feat: add LocalStoragePresetRepository"
```

---

### Task 3: Create usePresetsStore

**Files:**
- Create: `src/application/usePresetsStore.ts`

```typescript
import { create } from "zustand";
import type { ElementPreset } from "@/domain/models/Preset";
import { LocalStoragePresetRepository } from "@/infrastructure/repositories/LocalStoragePresetRepository";

const repo = new LocalStoragePresetRepository();

interface PresetsState {
  presets: ElementPreset[];
  load: () => Promise<void>;
  save: (preset: ElementPreset) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

export const usePresetsStore = create<PresetsState>((set) => ({
  presets: [],
  load: async () => set({ presets: await repo.getAllPresets() }),
  save: async (preset) => {
    await repo.savePreset(preset);
    set({ presets: await repo.getAllPresets() });
  },
  remove: async (id) => {
    await repo.deletePreset(id);
    set({ presets: await repo.getAllPresets() });
  },
}));
```

```bash
git add src/application/usePresetsStore.ts
git commit -m "feat: add usePresetsStore with load/save/remove"
```

---

### Task 4: Add "Save as Preset" button to PropertiesPanel

**Files:**
- Modify: `src/components/organisms/Editor/PropertiesPanel.tsx`

**Step 1:** Add imports:
```tsx
import { usePresetsStore } from "@/application/usePresetsStore";
import { Bookmark } from "lucide-react";
```

Note: `uuid` is likely already a dep. If not: `bun add uuid @types/uuid`

**Step 2:** In the PropertiesPanel header section (where the delete button is), add before the delete button:
```tsx
{node.type !== "ROOT" && (
  <Button
    variant="ghost"
    size="icon"
    title="Save as preset"
    onClick={() => {
      const name = window.prompt("Preset name:", `${node.type} preset`);
      if (!name) return;
      usePresetsStore.getState().save({
        id: crypto.randomUUID(),
        name,
        nodeType: node.type,
        props: { ...node.props },
        createdAt: new Date().toISOString(),
      });
    }}
  >
    <Bookmark className="h-4 w-4" />
  </Button>
)}
```

```bash
git add src/components/organisms/Editor/PropertiesPanel.tsx
git commit -m "feat: add Save as Preset button to PropertiesPanel header"
```

---

### Task 5: Add "My Presets" section to Sidebar

**Files:**
- Modify: `src/components/organisms/Editor/Sidebar.tsx`

**Step 1:** Add imports:
```tsx
import { usePresetsStore } from "@/application/usePresetsStore";
import { useEffect, useState } from "react";
import { BookmarkIcon, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import type { ElementPreset } from "@/domain/models/Preset";
```

**Step 2:** Create DraggablePresetBlock component (inside the file, before EditorSidebar):
```tsx
function DraggablePresetBlock({ preset }: { preset: ElementPreset }) {
  const remove = usePresetsStore((s) => s.remove);
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `preset-${preset.id}`,
    data: { type: preset.nodeType, isNew: true, presetProps: preset.props },
  });

  return (
    <div
      ref={setNodeRef} {...listeners} {...attributes}
      style={{ opacity: isDragging ? 0.5 : 1 }}
      className="relative group flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-border bg-card hover:border-primary/60 cursor-grab"
    >
      <BookmarkIcon className="h-4 w-4 text-muted-foreground shrink-0" />
      <span className="text-sm truncate flex-1">{preset.name}</span>
      <button
        className="absolute right-2 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-opacity"
        onPointerDown={(e) => { e.stopPropagation(); remove(preset.id); }}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
```

**Step 3:** Inside `EditorSidebar`, after the BLOCKS grid section, add:
```tsx
const presets = usePresetsStore((s) => s.presets);
const loadPresets = usePresetsStore((s) => s.load);
const [presetsOpen, setPresetsOpen] = useState(true);

useEffect(() => { loadPresets(); }, [loadPresets]);

{/* My Presets section */}
<div className="border-t border-border">
  <button
    onClick={() => setPresetsOpen((o) => !o)}
    className="flex items-center justify-between w-full px-4 py-3 text-sm font-medium hover:bg-muted/40"
  >
    <span className="flex items-center gap-2">
      <BookmarkIcon className="h-4 w-4" />
      My Presets
      {presets.length > 0 && (
        <span className="text-xs bg-primary/10 text-primary rounded-full px-1.5 py-0.5">
          {presets.length}
        </span>
      )}
    </span>
    {presetsOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
  </button>

  {presetsOpen && (
    <div className="px-4 pb-4 space-y-2">
      {presets.length === 0 ? (
        <p className="text-xs text-muted-foreground py-2">
          Save element styles as presets using the bookmark icon in the properties panel.
        </p>
      ) : (
        presets.map((preset) => (
          <DraggablePresetBlock key={preset.id} preset={preset} />
        ))
      )}
    </div>
  )}
</div>
```

```bash
git add src/components/organisms/Editor/Sidebar.tsx
git commit -m "feat: add My Presets collapsible section to Sidebar"
```

---

### Task 6: Handle presetProps in drag-end

**Files:**
- Modify: `src/app/editor/[id]/page.tsx`

**Step 1:** In `handleDragEnd`, find where `addNode` is called for new blocks. Before calling `getDefaultProps(type)`, check for `presetProps`:

```typescript
const presetProps = active.data.current?.presetProps;
addNode(parentId, {
  id: crypto.randomUUID(),
  type,
  props: presetProps ?? getDefaultProps(type),
  children: [],
}, insertIndex);
```

```bash
git add src/app/editor/[id]/page.tsx
git commit -m "feat: use presetProps when dropping preset blocks from sidebar"
```

---

### Verification
1. `npm run dev` → Open editor → Drag a TEXT block → style it (change color, font size)
2. In PropertiesPanel header → click the Bookmark icon → enter a name
3. Check Sidebar → "My Presets" section → preset appears
4. Drag the preset to canvas → new TEXT block should have the saved styles
5. Click trash icon on preset → it's removed from the list
