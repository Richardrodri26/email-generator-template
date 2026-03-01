# Keyboard Shortcuts — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Register a central set of keyboard shortcuts for common editor actions (undo, redo, delete node, duplicate node, save, deselect, open preview) and expose a help dialog that lists all available shortcuts.

**Architecture:** A `useKeyboardShortcuts` hook registers `keydown` listeners via `useEffect` and calls actions from `useEditorStore`. A `KeyboardShortcutRegistry` (plain object) maps shortcut keys to labels — used both by the hook and the help dialog. The help dialog (`ShortcutsHelpDialog`) is toggled via `?` key or a toolbar button.

**Tech Stack:** React 19, native `KeyboardEvent`, Shadcn Dialog + Table, `useEditorStore`, `usePreviewStore`

---

### Task 1: Define the shortcut registry

**Files:**
- Create: `src/application/utils/keyboardShortcuts.ts`

```typescript
export interface ShortcutDef {
  key: string;           // e.g. "z", "Delete", "?"
  modifiers: {
    ctrl?: boolean;
    meta?: boolean;      // Cmd on Mac
    shift?: boolean;
    alt?: boolean;
  };
  label: string;         // displayed in help dialog
  description: string;
  group: "Edit" | "Selection" | "View" | "File";
}

export const SHORTCUTS: ShortcutDef[] = [
  {
    key: "z",
    modifiers: { ctrl: true },
    label: "Ctrl+Z",
    description: "Undo",
    group: "Edit",
  },
  {
    key: "z",
    modifiers: { ctrl: true, shift: true },
    label: "Ctrl+Shift+Z",
    description: "Redo",
    group: "Edit",
  },
  {
    key: "y",
    modifiers: { ctrl: true },
    label: "Ctrl+Y",
    description: "Redo (alternative)",
    group: "Edit",
  },
  {
    key: "d",
    modifiers: { ctrl: true },
    label: "Ctrl+D",
    description: "Duplicate selected node",
    group: "Edit",
  },
  {
    key: "Delete",
    modifiers: {},
    label: "Delete",
    description: "Delete selected node",
    group: "Selection",
  },
  {
    key: "Backspace",
    modifiers: {},
    label: "Backspace",
    description: "Delete selected node",
    group: "Selection",
  },
  {
    key: "Escape",
    modifiers: {},
    label: "Escape",
    description: "Deselect node",
    group: "Selection",
  },
  {
    key: "s",
    modifiers: { ctrl: true },
    label: "Ctrl+S",
    description: "Save template",
    group: "File",
  },
  {
    key: "p",
    modifiers: { ctrl: true, shift: true },
    label: "Ctrl+Shift+P",
    description: "Open preview",
    group: "View",
  },
  {
    key: "?",
    modifiers: {},
    label: "?",
    description: "Show keyboard shortcuts",
    group: "View",
  },
];

/**
 * Returns true if the keyboard event matches the shortcut definition.
 */
export function matchesShortcut(e: KeyboardEvent, def: ShortcutDef): boolean {
  const ctrlOrMeta = def.modifiers.ctrl || def.modifiers.meta;
  const hasCtrlOrMeta = e.ctrlKey || e.metaKey;

  return (
    e.key === def.key &&
    (ctrlOrMeta ? hasCtrlOrMeta : !hasCtrlOrMeta) &&
    !!e.shiftKey === !!def.modifiers.shift &&
    !!e.altKey === !!def.modifiers.alt
  );
}
```

---

### Task 2: Create useKeyboardShortcuts hook

**Files:**
- Create: `src/application/useKeyboardShortcuts.ts`

**Step 1: Read useEditorStore to identify action method names**

The hook needs: `undo`, `redo`, `deleteNode`, `setSelectedNodeId` (for deselect), and the selected node ID.

**Step 2: Create the hook**

```typescript
import { useEffect, useRef, useState } from "react";
import { useEditorStore } from "./useEditorStore";
import { usePreviewStore } from "./usePreviewStore";
import { SHORTCUTS, matchesShortcut } from "./utils/keyboardShortcuts";

interface Options {
  templateId: string;
  onSave: () => void;
}

export function useKeyboardShortcuts({ templateId, onSave }: Options) {
  const [helpOpen, setHelpOpen] = useState(false);

  const undo = useEditorStore((s) => s.undo);
  const redo = useEditorStore((s) => s.redo);
  const selectedNodeId = useEditorStore((s) => s.selectedNodeId);
  const deleteNode = useEditorStore((s) => s.deleteNode);
  const setSelectedNodeId = useEditorStore((s) => s.setSelectedNodeId);
  const duplicateNode = useEditorStore((s) => s.duplicateNode); // may need to be added
  const setModalOpen = usePreviewStore((s) => s.setModalOpen);

  // Stable refs so the event listener closure doesn't go stale
  const actionsRef = useRef({
    undo, redo, deleteNode, setSelectedNodeId, duplicateNode, setModalOpen, onSave,
    selectedNodeId,
  });
  useEffect(() => {
    actionsRef.current = {
      undo, redo, deleteNode, setSelectedNodeId, duplicateNode, setModalOpen, onSave,
      selectedNodeId,
    };
  });

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't fire shortcuts when user is typing in an input/textarea
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable) {
        // Allow Escape even in inputs (to blur/deselect)
        if (e.key !== "Escape") return;
      }

      const a = actionsRef.current;

      if (matchesShortcut(e, SHORTCUTS.find((s) => s.description === "Undo")!)) {
        e.preventDefault();
        a.undo();
      } else if (
        matchesShortcut(e, SHORTCUTS.find((s) => s.description === "Redo")!) ||
        matchesShortcut(e, SHORTCUTS.find((s) => s.description === "Redo (alternative)")!)
      ) {
        e.preventDefault();
        a.redo();
      } else if (
        (e.key === "Delete" || e.key === "Backspace") &&
        !e.ctrlKey && !e.metaKey &&
        a.selectedNodeId
      ) {
        e.preventDefault();
        a.deleteNode(a.selectedNodeId);
      } else if (e.key === "Escape") {
        a.setSelectedNodeId(null);
      } else if (matchesShortcut(e, SHORTCUTS.find((s) => s.description === "Duplicate selected node")!)) {
        e.preventDefault();
        if (a.selectedNodeId && a.duplicateNode) a.duplicateNode(a.selectedNodeId);
      } else if (matchesShortcut(e, SHORTCUTS.find((s) => s.description === "Save template")!)) {
        e.preventDefault();
        a.onSave();
      } else if (matchesShortcut(e, SHORTCUTS.find((s) => s.description === "Open preview")!)) {
        e.preventDefault();
        a.setModalOpen(true);
      } else if (e.key === "?" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        setHelpOpen((o) => !o);
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []); // intentionally empty — uses refs

  return { helpOpen, setHelpOpen };
}
```

> **Note:** If `duplicateNode` doesn't exist in `useEditorStore`, add it in the next task. If `undo`/`redo` names differ, adapt accordingly.

---

### Task 3: Add duplicateNode to useEditorStore (if missing)

**Files:**
- Modify: `src/application/useEditorStore.ts`

**Step 1: Read the file to check if `duplicateNode` exists**

**Step 2: If missing, add it using Immer**

```typescript
duplicateNode: (id: string) => {
  set((state) => {
    const node = state.present.nodes[id];
    if (!node || node.type === "ROOT") return;

    // Deep clone with new IDs
    const idMap: Record<string, string> = {};
    const collectIds = (nodeId: string) => {
      idMap[nodeId] = uuidv4();
      state.present.nodes[nodeId].children.forEach(collectIds);
    };
    collectIds(id);

    const cloneNode = (nodeId: string) => {
      const original = state.present.nodes[nodeId];
      state.present.nodes[idMap[nodeId]] = {
        ...original,
        id: idMap[nodeId],
        children: original.children.map((c) => idMap[c]),
      };
      original.children.forEach(cloneNode);
    };
    cloneNode(id);

    // Insert the duplicated root node after the original in its parent
    const parentId = Object.keys(state.present.nodes).find((pid) =>
      state.present.nodes[pid].children.includes(id)
    );
    if (parentId) {
      const parent = state.present.nodes[parentId];
      const idx = parent.children.indexOf(id);
      parent.children.splice(idx + 1, 0, idMap[id]);
    }
  });
},
```

---

### Task 4: Create ShortcutsHelpDialog component

**Files:**
- Create: `src/components/organisms/Editor/ShortcutsHelpDialog.tsx`

```tsx
"use client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SHORTCUTS, type ShortcutDef } from "@/application/utils/keyboardShortcuts";

const GROUPS = ["Edit", "Selection", "File", "View"] as const;

interface Props {
  open: boolean;
  onClose: () => void;
}

function ShortcutRow({ def }: { def: ShortcutDef }) {
  return (
    <div className="flex items-center justify-between py-1.5 text-sm">
      <span className="text-muted-foreground">{def.description}</span>
      <kbd className="font-mono bg-muted text-muted-foreground text-xs px-2 py-0.5 rounded border border-border">
        {def.label}
      </kbd>
    </div>
  );
}

export function ShortcutsHelpDialog({ open, onClose }: Props) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Keyboard shortcuts</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          {GROUPS.map((group) => {
            const defs = SHORTCUTS.filter((s) => s.group === group);
            if (!defs.length) return null;
            return (
              <div key={group}>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  {group}
                </h3>
                <div className="divide-y divide-border">
                  {defs.map((def) => (
                    <ShortcutRow key={def.label + def.description} def={def} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground text-center pt-2">
          Press <kbd className="font-mono bg-muted px-1 rounded">?</kbd> to toggle this dialog
        </p>
      </DialogContent>
    </Dialog>
  );
}
```

---

### Task 5: Wire into editor page

**Files:**
- Modify: `src/app/editor/[id]/page.tsx`

**Step 1: Read the current page to find the toolbar and save handler**

**Step 2: Add the hook and dialog**

```tsx
import { useKeyboardShortcuts } from "@/application/useKeyboardShortcuts";
import { ShortcutsHelpDialog } from "@/components/organisms/Editor/ShortcutsHelpDialog";

// Inside the component, after the save handler is defined:
const { helpOpen, setHelpOpen } = useKeyboardShortcuts({
  templateId,
  onSave: handleSave, // adapt to actual save handler name
});

// In JSX, after other dialogs:
<ShortcutsHelpDialog open={helpOpen} onClose={() => setHelpOpen(false)} />
```

**Step 3: Add a help button in the toolbar**

```tsx
import { Keyboard } from "lucide-react";

// In toolbar:
<Button
  variant="ghost"
  size="icon"
  title="Keyboard shortcuts (?)"
  onClick={() => setHelpOpen(true)}
>
  <Keyboard className="h-4 w-4" />
</Button>
```

---

### Task 6: Manual test

**Step 1:** `npm run dev` → open any template in the editor

**Step 2:** Press `?` → help dialog opens with all shortcuts listed

**Step 3:** Press `Ctrl+Z` → last action is undone

**Step 4:** Press `Ctrl+Shift+Z` → redo

**Step 5:** Click a node to select it → press `Delete` → node is removed

**Step 6:** Click a node → press `Ctrl+D` → node is duplicated below

**Step 7:** Press `Escape` → node is deselected

**Step 8:** Press `Ctrl+S` → template saves (check for save feedback)

**Step 9:** Press `Ctrl+Shift+P` → preview modal opens

**Step 10:** Click into a text input field → verify `Delete` does NOT fire the delete-node action

---

### Task 7: Commit

```bash
git add src/application/utils/keyboardShortcuts.ts \
        src/application/useKeyboardShortcuts.ts \
        src/application/useEditorStore.ts \
        src/components/organisms/Editor/ShortcutsHelpDialog.tsx \
        src/app/editor/
git commit -m "feat: add keyboard shortcuts with help dialog"
```
