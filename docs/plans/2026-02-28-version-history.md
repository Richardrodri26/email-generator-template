# Version History — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Auto-save snapshots of the template tree every N changes in the editor, with a collapsible version history panel that lets users browse and restore any snapshot.

**Architecture:** New domain model `TemplateVersion` + `VersionRepository` port. `LocalStorageVersionRepository` persists up to 20 versions per template keyed by templateId. `useVersionStore` (Zustand) holds the current session list. A `useAutoSave` hook (Immer change count trigger) writes a new version on every 5th store change. A `VersionHistoryPanel` component (in the editor sidebar or a new right drawer) shows the list and triggers restore via `useEditorStore.loadSnapshot`.

**Tech Stack:** Zustand, Immer, localStorage, date-fns (already likely present via shadcn), Shadcn Sheet

---

### Task 1: Define TemplateVersion domain model

**Files:**
- Create: `src/domain/models/TemplateVersion.ts`

```typescript
import type { TemplateData } from "./Template";

export interface TemplateVersion {
  id: string;             // uuid
  templateId: string;
  createdAt: string;      // ISO string
  label: string;          // e.g. "Auto-save #3" or user-provided name
  data: TemplateData;
}
```

---

### Task 2: Define VersionRepository port

**Files:**
- Create: `src/domain/repositories/VersionRepository.ts`

```typescript
import type { TemplateVersion } from "../models/TemplateVersion";

export interface VersionRepository {
  /** Returns versions for a template, newest first */
  getVersions(templateId: string): Promise<TemplateVersion[]>;
  saveVersion(version: TemplateVersion): Promise<void>;
  deleteVersion(id: string): Promise<void>;
  /** Keep only the latest N versions, deleting oldest */
  prune(templateId: string, keep: number): Promise<void>;
}
```

---

### Task 3: Implement LocalStorageVersionRepository

**Files:**
- Create: `src/infrastructure/repositories/LocalStorageVersionRepository.ts`

```typescript
import { v4 as uuidv4 } from "uuid";
import type { VersionRepository } from "@/domain/repositories/VersionRepository";
import type { TemplateVersion } from "@/domain/models/TemplateVersion";
import type { TemplateData } from "@/domain/models/Template";

const KEY_PREFIX = "mailgen_versions_";

export class LocalStorageVersionRepository implements VersionRepository {
  private key(templateId: string) {
    return `${KEY_PREFIX}${templateId}`;
  }

  async getVersions(templateId: string): Promise<TemplateVersion[]> {
    const raw = localStorage.getItem(this.key(templateId));
    return raw ? JSON.parse(raw) : [];
  }

  async saveVersion(version: TemplateVersion): Promise<void> {
    const existing = await this.getVersions(version.templateId);
    // Newest first
    const updated = [version, ...existing];
    localStorage.setItem(this.key(version.templateId), JSON.stringify(updated));
  }

  async deleteVersion(id: string): Promise<void> {
    // We need to scan all keys — inefficient but acceptable for localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key?.startsWith(KEY_PREFIX)) continue;
      const versions: TemplateVersion[] = JSON.parse(localStorage.getItem(key) ?? "[]");
      const filtered = versions.filter((v) => v.id !== id);
      if (filtered.length !== versions.length) {
        localStorage.setItem(key, JSON.stringify(filtered));
        return;
      }
    }
  }

  async prune(templateId: string, keep: number): Promise<void> {
    const versions = await this.getVersions(templateId);
    if (versions.length <= keep) return;
    const pruned = versions.slice(0, keep);
    localStorage.setItem(this.key(templateId), JSON.stringify(pruned));
  }
}
```

---

### Task 4: Create VersionService

**Files:**
- Create: `src/application/services/VersionService.ts`

```typescript
import { v4 as uuidv4 } from "uuid";
import type { VersionRepository } from "@/domain/repositories/VersionRepository";
import type { TemplateVersion } from "@/domain/models/TemplateVersion";
import type { TemplateData } from "@/domain/models/Template";

const MAX_VERSIONS = 20;

export class VersionService {
  constructor(private repository: VersionRepository) {}

  async createAutoSave(templateId: string, data: TemplateData, index: number): Promise<TemplateVersion> {
    const version: TemplateVersion = {
      id: uuidv4(),
      templateId,
      createdAt: new Date().toISOString(),
      label: `Auto-save #${index}`,
      data: structuredClone(data),
    };
    await this.repository.saveVersion(version);
    await this.repository.prune(templateId, MAX_VERSIONS);
    return version;
  }

  async getVersions(templateId: string): Promise<TemplateVersion[]> {
    return this.repository.getVersions(templateId);
  }

  async deleteVersion(id: string): Promise<void> {
    return this.repository.deleteVersion(id);
  }
}
```

---

### Task 5: Register in config/services.ts

**Files:**
- Modify: `src/config/services.ts`

Read the file first, then add:

```typescript
import { LocalStorageVersionRepository } from "@/infrastructure/repositories/LocalStorageVersionRepository";
import { VersionService } from "@/application/services/VersionService";

export const versionService = new VersionService(
  new LocalStorageVersionRepository()
);
```

---

### Task 6: Create useVersionStore

**Files:**
- Create: `src/application/useVersionStore.ts`

```typescript
import { create } from "zustand";
import type { TemplateVersion } from "@/domain/models/TemplateVersion";
import { versionService } from "@/config/services";

interface VersionState {
  versions: TemplateVersion[];
  loading: boolean;
  autoSaveCount: number;
  loadVersions: (templateId: string) => Promise<void>;
  saveVersion: (templateId: string, data: import("@/domain/models/Template").TemplateData) => Promise<void>;
  deleteVersion: (id: string) => Promise<void>;
}

export const useVersionStore = create<VersionState>((set, get) => ({
  versions: [],
  loading: false,
  autoSaveCount: 0,

  loadVersions: async (templateId) => {
    set({ loading: true });
    const versions = await versionService.getVersions(templateId);
    set({ versions, loading: false });
  },

  saveVersion: async (templateId, data) => {
    const count = get().autoSaveCount + 1;
    const version = await versionService.createAutoSave(templateId, data, count);
    set((s) => ({
      versions: [version, ...s.versions].slice(0, 20),
      autoSaveCount: count,
    }));
  },

  deleteVersion: async (id) => {
    await versionService.deleteVersion(id);
    set((s) => ({ versions: s.versions.filter((v) => v.id !== id) }));
  },
}));
```

---

### Task 7: Add loadSnapshot to useEditorStore

**Files:**
- Modify: `src/application/useEditorStore.ts`

**Step 1: Read the file to understand the current store shape**

**Step 2: Add a `loadSnapshot` action** that replaces the current `data` with a given `TemplateData` (pushing to history so it's undoable):

```typescript
loadSnapshot: (snapshot: TemplateData) => {
  set((state) => {
    // Push current state to history before replacing
    state.history = [
      ...state.history.slice(0, state.historyIndex + 1),
      snapshot,
    ];
    state.historyIndex = state.history.length - 1;
    state.present = snapshot;
  });
},
```

> Adapt to the actual field names in the store (present/past/future depending on the undo implementation).

---

### Task 8: Create useAutoSave hook

**Files:**
- Create: `src/application/useAutoSave.ts`

This hook watches the editor store change count and saves a version every 5 changes.

```typescript
import { useEffect, useRef } from "react";
import { useEditorStore } from "./useEditorStore";
import { useVersionStore } from "./useVersionStore";

const SAVE_EVERY = 5; // changes

export function useAutoSave(templateId: string) {
  const data = useEditorStore((s) => s.present); // or s.data — check actual field name
  const changeCountRef = useRef(0);
  const saveVersion = useVersionStore((s) => s.saveVersion);

  useEffect(() => {
    changeCountRef.current += 1;
    if (changeCountRef.current % SAVE_EVERY === 0) {
      saveVersion(templateId, data);
    }
  }, [data]); // eslint-disable-line react-hooks/exhaustive-deps
}
```

---

### Task 9: Create VersionHistoryPanel component

**Files:**
- Create: `src/components/organisms/Editor/VersionHistoryPanel.tsx`

```tsx
"use client";
import { useEffect } from "react";
import { useVersionStore } from "@/application/useVersionStore";
import { useEditorStore } from "@/application/useEditorStore";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trash2, RotateCcw } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Props {
  templateId: string;
}

export function VersionHistoryPanel({ templateId }: Props) {
  const { versions, loading, loadVersions, deleteVersion } = useVersionStore();
  const loadSnapshot = useEditorStore((s) => s.loadSnapshot);

  useEffect(() => {
    loadVersions(templateId);
  }, [templateId]);

  if (loading) return <p className="p-4 text-sm text-muted-foreground">Loading...</p>;

  if (versions.length === 0)
    return (
      <p className="p-4 text-sm text-muted-foreground">
        No versions yet. Auto-save triggers every 5 changes.
      </p>
    );

  return (
    <ScrollArea className="h-full">
      <div className="space-y-2 p-3">
        {versions.map((v) => (
          <div
            key={v.id}
            className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
          >
            <div>
              <p className="font-medium">{v.label}</p>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(v.createdAt), { addSuffix: true })}
              </p>
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                title="Restore this version"
                onClick={() => loadSnapshot(v.data)}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                title="Delete this version"
                onClick={() => deleteVersion(v.id)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
```

> Requires: `npx shadcn add scroll-area` if not already present.

---

### Task 10: Wire into the editor page

**Files:**
- Modify: `src/app/editor/[id]/page.tsx`

**Step 1: Read the current editor page**

**Step 2: Add `useAutoSave(templateId)` call inside the page component**

**Step 3: Add a "History" tab or button in the toolbar that opens/shows `VersionHistoryPanel`**

Option A — Add as a Sheet (drawer):
```tsx
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { History } from "lucide-react";

// In toolbar:
<Sheet>
  <SheetTrigger asChild>
    <Button variant="ghost" size="sm">
      <History className="h-4 w-4 mr-1" />
      History
    </Button>
  </SheetTrigger>
  <SheetContent side="right" className="w-80 p-0">
    <SheetHeader className="p-4 pb-0">
      <SheetTitle>Version History</SheetTitle>
    </SheetHeader>
    <VersionHistoryPanel templateId={templateId} />
  </SheetContent>
</Sheet>
```

> Requires: `npx shadcn add sheet` if not present.

---

### Task 11: Manual test

**Step 1:** `npm run dev` → open any template in the editor

**Step 2:** Make 5+ changes (add/move nodes)

**Step 3:** Click "History" → panel opens → auto-saves appear

**Step 4:** Click the restore icon on an older version → canvas reverts

**Step 5:** Confirm the restore is undoable with Ctrl+Z

**Step 6:** Refresh browser → versions persist

---

### Task 12: Commit

```bash
git add src/domain/models/TemplateVersion.ts \
        src/domain/repositories/VersionRepository.ts \
        src/infrastructure/repositories/LocalStorageVersionRepository.ts \
        src/application/services/VersionService.ts \
        src/application/useVersionStore.ts \
        src/application/useAutoSave.ts \
        src/config/services.ts \
        src/application/useEditorStore.ts \
        src/components/organisms/Editor/VersionHistoryPanel.tsx \
        src/app/editor/
git commit -m "feat: add auto-save version history with restore"
```
