# Duplicate & Rename Templates — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Allow users to duplicate an existing template (deep copy with new IDs) and rename any template inline from the dashboard.

**Architecture:** Add `duplicateTemplate` and `renameTemplate` to the `TemplateRepository` port → implement in all three repos → expose via `TemplateService` → wire React Query mutations → add a dedicated API route for duplicate → update the `TemplateTable` actions column with a dropdown menu.

**Tech Stack:** React Query v5 mutations, Shadcn DropdownMenu + Dialog + Input, uuid, Next.js App Router API routes

---

### Task 1: Extend TemplateRepository port

**Files:**
- Modify: `src/domain/repositories/TemplateRepository.ts`

Add two new method signatures to the interface:

```typescript
export interface TemplateRepository {
  getTemplateById(id: string): Promise<Template | null>;
  getTemplatesByAuthor(authorId: string): Promise<Template[]>;
  saveTemplate(template: Template): Promise<void>;
  deleteTemplate(id: string): Promise<void>;
  // NEW
  duplicateTemplate(id: string, newAuthorId: string): Promise<Template>;
  renameTemplate(id: string, newName: string): Promise<Template>;
}
```

**Step 1: Edit the file**

Replace the export interface body with the version above.

**Step 2: Verify TypeScript errors surface**

Run:
```bash
npm run build 2>&1 | head -40
```
Expected: errors in the three repository implementations (they don't implement the new methods yet). This confirms the port is enforced.

---

### Task 2: Implement in LocalStorageTemplateRepository

**Files:**
- Modify: `src/infrastructure/repositories/LocalStorageTemplateRepository.ts`

Read the file first, then add these two methods:

```typescript
async duplicateTemplate(id: string, newAuthorId: string): Promise<Template> {
  const source = await this.getTemplateById(id);
  if (!source) throw new Error(`Template ${id} not found`);

  // Deep-clone nodes with new IDs
  const idMap: Record<string, string> = {};
  const newNodes: Record<string, EditorNode> = {};

  for (const nodeId of Object.keys(source.data.nodes)) {
    idMap[nodeId] = uuidv4();
  }

  for (const [oldId, node] of Object.entries(source.data.nodes)) {
    newNodes[idMap[oldId]] = {
      ...node,
      id: idMap[oldId],
      children: node.children.map((c) => idMap[c] ?? c),
    };
  }

  const duplicate: Template = {
    ...source,
    id: uuidv4(),
    name: `${source.name} (copy)`,
    authorId: newAuthorId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    data: {
      rootNodeId: idMap[source.data.rootNodeId],
      nodes: newNodes,
    },
  };

  await this.saveTemplate(duplicate);
  return duplicate;
}

async renameTemplate(id: string, newName: string): Promise<Template> {
  const template = await this.getTemplateById(id);
  if (!template) throw new Error(`Template ${id} not found`);
  const updated: Template = {
    ...template,
    name: newName.trim(),
    updatedAt: new Date().toISOString(),
  };
  await this.saveTemplate(updated);
  return updated;
}
```

**Step 1: Add `import { v4 as uuidv4 } from "uuid"` if not present**

**Step 2: Implement both methods**

**Step 3: Run build to confirm this repo satisfies the interface**

```bash
npm run build 2>&1 | grep "LocalStorage"
```
Expected: No errors for LocalStorageTemplateRepository.

---

### Task 3: Implement in MockTemplateRepository

**Files:**
- Modify: `src/infrastructure/repositories/MockTemplateRepository.ts`

Add stub implementations (MockRepository is server-side SSR, no real mutation needed):

```typescript
async duplicateTemplate(id: string, newAuthorId: string): Promise<Template> {
  throw new Error("MockTemplateRepository does not support mutations");
}

async renameTemplate(id: string, newName: string): Promise<Template> {
  throw new Error("MockTemplateRepository does not support mutations");
}
```

---

### Task 4: Implement in ApiTemplateRepository

**Files:**
- Modify: `src/infrastructure/repositories/ApiTemplateRepository.ts`

Add API calls:

```typescript
async duplicateTemplate(id: string, newAuthorId: string): Promise<Template> {
  const res = await fetch(`/api/templates/${id}/duplicate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ newAuthorId }),
  });
  if (!res.ok) throw new Error("Failed to duplicate template");
  return res.json();
}

async renameTemplate(id: string, newName: string): Promise<Template> {
  const res = await fetch(`/api/templates/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: newName }),
  });
  if (!res.ok) throw new Error("Failed to rename template");
  return res.json();
}
```

---

### Task 5: Implement in TemplateService

**Files:**
- Modify: `src/application/services/TemplateService.ts`

Add two service methods:

```typescript
async duplicateTemplate(id: string, authorId: string): Promise<Template> {
  return this.repository.duplicateTemplate(id, authorId);
}

async renameTemplate(id: string, newName: string): Promise<Template> {
  if (!newName.trim()) throw new Error("Template name cannot be empty");
  return this.repository.renameTemplate(id, newName);
}
```

---

### Task 6: Add API route for duplicate

**Files:**
- Create: `src/app/api/templates/[id]/duplicate/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { localTemplateService } from "@/config/services";
import { z } from "zod";

const bodySchema = z.object({ newAuthorId: z.string().min(1) });

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = bodySchema.parse(await req.json());
    const duplicate = await localTemplateService.duplicateTemplate(
      id,
      body.newAuthorId
    );
    return NextResponse.json(duplicate, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError)
      return NextResponse.json({ error: err.flatten() }, { status: 400 });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

---

### Task 7: Add PATCH support to existing [id] route

**Files:**
- Modify: `src/app/api/templates/[id]/route.ts`

Read the file first. Add a PATCH handler:

```typescript
const renameSchema = z.object({ name: z.string().min(1).max(100) });

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = renameSchema.parse(await req.json());
    const updated = await localTemplateService.renameTemplate(id, body.name);
    return NextResponse.json(updated);
  } catch (err) {
    if (err instanceof z.ZodError)
      return NextResponse.json({ error: err.flatten() }, { status: 400 });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

---

### Task 8: Add React Query mutations

**Files:**
- Modify: `src/infrastructure/hooks/useTemplatesQuery.ts`

Append two new mutation hooks:

```typescript
export function useDuplicateTemplateMutation(
  service: TemplateService,
  userId?: string,
  queryKeyPrefix = ["templates"]
) {
  const queryClient = useQueryClient();
  const queryKey = userId ? [...queryKeyPrefix, userId] : queryKeyPrefix;
  return useMutation({
    mutationFn: async (id: string) => {
      if (!userId) throw new Error("User ID required");
      return service.duplicateTemplate(id, userId);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });
}

export function useRenameTemplateMutation(
  service: TemplateService,
  userId?: string,
  queryKeyPrefix = ["templates"]
) {
  const queryClient = useQueryClient();
  const queryKey = userId ? [...queryKeyPrefix, userId] : queryKeyPrefix;
  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      return service.renameTemplate(id, name);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });
}
```

---

### Task 9: Update TemplateTable columns with actions

**Files:**
- Modify: `src/components/features/TemplateTable/columns.tsx`
- Modify: `src/components/features/TemplateTable/data-table.tsx`

**Step 1: Read both files to understand the current shape**

**Step 2: Pass mutation callbacks as props to the columns factory**

The `columns` function should accept:
```typescript
type ColumnCallbacks = {
  onDuplicate: (id: string) => void;
  onRename: (id: string, currentName: string) => void;
  onDelete: (id: string) => void;
};
```

**Step 3: Replace the delete action cell with a DropdownMenu**

```tsx
// In the actions column cell:
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" size="icon">
      <MoreHorizontal className="h-4 w-4" />
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end">
    <DropdownMenuItem onClick={() => router.push(`/editor/${row.original.id}`)}>
      Open
    </DropdownMenuItem>
    <DropdownMenuItem onClick={() => onDuplicate(row.original.id)}>
      Duplicate
    </DropdownMenuItem>
    <DropdownMenuItem onClick={() => onRename(row.original.id, row.original.name)}>
      Rename
    </DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem
      className="text-destructive"
      onClick={() => onDelete(row.original.id)}
    >
      Delete
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

**Step 4: Wire callbacks in dashboard/page.tsx**

```tsx
const duplicateMutation = useDuplicateTemplateMutation(apiTemplateService, user?.id);
const renameMutation = useRenameTemplateMutation(apiTemplateService, user?.id);

const handleDuplicate = (id: string) => duplicateMutation.mutate(id);
const handleRename = (id: string, currentName: string) => {
  // open rename dialog (Task 10)
};
```

---

### Task 10: Add RenameDialog component

**Files:**
- Create: `src/components/features/TemplateTable/RenameDialog.tsx`

```tsx
"use client";
import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Props {
  open: boolean;
  currentName: string;
  onConfirm: (newName: string) => void;
  onClose: () => void;
}

export function RenameDialog({ open, currentName, onConfirm, onClose }: Props) {
  const [name, setName] = useState(currentName);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) onConfirm(name.trim());
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rename template</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            placeholder="Template name"
          />
          <DialogFooter>
            <Button variant="outline" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim()}>
              Rename
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

**Step 1: Wire RenameDialog state in dashboard/page.tsx**

```tsx
const [renameState, setRenameState] = useState<{ id: string; name: string } | null>(null);

const handleRename = (id: string, currentName: string) =>
  setRenameState({ id, currentName });

const handleRenameConfirm = (newName: string) => {
  if (!renameState) return;
  renameMutation.mutate({ id: renameState.id, name: newName });
  setRenameState(null);
};
```

---

### Task 11: Manual test

**Step 1:** Run `npm run dev`

**Step 2:** Open `/dashboard`

**Step 3:** Verify the actions dropdown appears on each row

**Step 4:** Click "Duplicate" → a new row with "(copy)" suffix appears

**Step 5:** Click "Rename" → dialog opens with current name pre-filled → submit → row name updates

**Step 6:** Verify both actions persist across page refresh

---

### Task 12: Commit

```bash
git add src/domain/repositories/TemplateRepository.ts \
        src/infrastructure/repositories/ \
        src/application/services/TemplateService.ts \
        src/infrastructure/hooks/useTemplatesQuery.ts \
        src/app/api/templates/ \
        src/components/features/TemplateTable/ \
        src/app/dashboard/page.tsx
git commit -m "feat: add duplicate and rename template actions"
```
