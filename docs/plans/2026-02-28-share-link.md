# Share Link — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Let users generate a public read-only link for any template. Anyone with the link can preview the rendered email but cannot edit it.

**Architecture:** Add an optional `shareId` (nanoid slug) to the `Template` domain model. A new API route `GET /api/share/[shareId]` looks up the template by shareId and returns it. A public page `/share/[shareId]` renders the email preview (read-only canvas). In the editor toolbar, a "Share" button generates a shareId (if none exists), saves it, copies the URL to clipboard.

**Tech Stack:** nanoid (for short URL-safe slugs), Next.js App Router dynamic routes, Shadcn Popover + Button, clipboard API

---

### Task 1: Install nanoid

```bash
npm install nanoid
```

Verify:
```bash
node -e "const { nanoid } = require('nanoid'); console.log(nanoid(10))"
```
Expected: a 10-character alphanumeric slug.

---

### Task 2: Extend Template domain model

**Files:**
- Modify: `src/domain/models/Template.ts`

Add optional field:
```typescript
export interface Template {
  id: string;
  name: string;
  description?: string;
  authorId: string;
  createdAt: string;
  updatedAt: string;
  data: TemplateData;
  htmlPreview?: string;
  shareId?: string;    // NEW — short nanoid slug, set when sharing is enabled
}
```

---

### Task 3: Add getTemplateByShareId to TemplateRepository port

**Files:**
- Modify: `src/domain/repositories/TemplateRepository.ts`

```typescript
export interface TemplateRepository {
  getTemplateById(id: string): Promise<Template | null>;
  getTemplatesByAuthor(authorId: string): Promise<Template[]>;
  saveTemplate(template: Template): Promise<void>;
  deleteTemplate(id: string): Promise<void>;
  getTemplateByShareId(shareId: string): Promise<Template | null>; // NEW
}
```

---

### Task 4: Implement getTemplateByShareId in LocalStorageTemplateRepository

**Files:**
- Modify: `src/infrastructure/repositories/LocalStorageTemplateRepository.ts`

**Step 1: Read the file to understand the storage key and list pattern**

**Step 2: Add the method**

```typescript
async getTemplateByShareId(shareId: string): Promise<Template | null> {
  // LocalStorage stores templates by userId. We need to scan all keys.
  const allTemplates: Template[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key?.startsWith("mailgen_templates_")) continue;
    const raw = localStorage.getItem(key);
    if (!raw) continue;
    const templates: Template[] = JSON.parse(raw);
    allTemplates.push(...templates);
  }
  return allTemplates.find((t) => t.shareId === shareId) ?? null;
}
```

---

### Task 5: Implement in MockTemplateRepository and ApiTemplateRepository

**Files:**
- Modify: `src/infrastructure/repositories/MockTemplateRepository.ts`
- Modify: `src/infrastructure/repositories/ApiTemplateRepository.ts`

**MockTemplateRepository:**
```typescript
async getTemplateByShareId(shareId: string): Promise<Template | null> {
  return null; // SSR mock — no sharing needed
}
```

**ApiTemplateRepository:**
```typescript
async getTemplateByShareId(shareId: string): Promise<Template | null> {
  const res = await fetch(`/api/share/${shareId}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to fetch shared template");
  return res.json();
}
```

---

### Task 6: Add generateShareLink and revokeShareLink to TemplateService

**Files:**
- Modify: `src/application/services/TemplateService.ts`

```typescript
import { nanoid } from "nanoid";

async generateShareLink(id: string): Promise<Template> {
  const template = await this.repository.getTemplateById(id);
  if (!template) throw new Error(`Template ${id} not found`);
  if (template.shareId) return template; // Already shared
  const updated: Template = {
    ...template,
    shareId: nanoid(10),
    updatedAt: new Date().toISOString(),
  };
  await this.repository.saveTemplate(updated);
  return updated;
}

async revokeShareLink(id: string): Promise<Template> {
  const template = await this.repository.getTemplateById(id);
  if (!template) throw new Error(`Template ${id} not found`);
  const { shareId: _, ...rest } = template;
  const updated: Template = { ...rest, updatedAt: new Date().toISOString() };
  await this.repository.saveTemplate(updated);
  return updated;
}

async getTemplateByShareId(shareId: string): Promise<Template | null> {
  return this.repository.getTemplateByShareId(shareId);
}
```

---

### Task 7: Create GET /api/share/[shareId] route

**Files:**
- Create: `src/app/api/share/[shareId]/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { localTemplateService } from "@/config/services";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ shareId: string }> }
) {
  const { shareId } = await params;
  const template = await localTemplateService.getTemplateByShareId(shareId);
  if (!template) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  // Return only the fields needed for read-only preview
  return NextResponse.json({
    id: template.id,
    name: template.name,
    data: template.data,
  });
}
```

---

### Task 8: Create public share page

**Files:**
- Create: `src/app/share/[shareId]/page.tsx`

```tsx
import { notFound } from "next/navigation";
import { localTemplateService } from "@/config/services";

interface Props {
  params: Promise<{ shareId: string }>;
}

export default async function SharePage({ params }: Props) {
  const { shareId } = await params;
  const template = await localTemplateService.getTemplateByShareId(shareId);

  if (!template) notFound();

  return (
    <div className="min-h-screen bg-muted flex flex-col items-center py-10 px-4">
      <div className="w-full max-w-2xl space-y-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">{template.name}</h1>
          <p className="text-sm text-muted-foreground">Read-only preview</p>
        </div>
        {/* Render using htmlPreview if available, otherwise show a notice */}
        {template.htmlPreview ? (
          <div className="rounded-lg overflow-hidden border bg-white shadow-sm">
            <iframe
              srcDoc={template.htmlPreview}
              className="w-full min-h-[600px] border-0"
              title={template.name}
              sandbox="allow-same-origin"
            />
          </div>
        ) : (
          <div className="rounded-lg border bg-white p-8 text-center text-muted-foreground">
            <p>No preview available. Open in the editor and export to generate one.</p>
          </div>
        )}
      </div>
    </div>
  );
}
```

---

### Task 9: Create ShareButton component

**Files:**
- Create: `src/components/organisms/Editor/ShareButton.tsx`

```tsx
"use client";
import { useState } from "react";
import { Share2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { apiTemplateService } from "@/config/services";

interface Props {
  templateId: string;
  initialShareId?: string;
  onShareIdChange?: (shareId: string | undefined) => void;
}

export function ShareButton({ templateId, initialShareId, onShareIdChange }: Props) {
  const [shareId, setShareId] = useState<string | undefined>(initialShareId);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const shareUrl = shareId
    ? `${window.location.origin}/share/${shareId}`
    : null;

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const updated = await apiTemplateService.generateShareLink(templateId);
      setShareId(updated.shareId);
      onShareIdChange?.(updated.shareId);
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async () => {
    setLoading(true);
    try {
      await apiTemplateService.revokeShareLink(templateId);
      setShareId(undefined);
      onShareIdChange?.(undefined);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          <Share2 className="h-4 w-4 mr-1" />
          Share
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 space-y-3">
        <p className="text-sm font-medium">Share template</p>
        {shareUrl ? (
          <>
            <div className="flex gap-2">
              <Input value={shareUrl} readOnly className="text-xs" />
              <Button size="sm" variant="outline" onClick={handleCopy}>
                {copied ? <Check className="h-4 w-4" /> : "Copy"}
              </Button>
            </div>
            <Button
              size="sm"
              variant="destructive"
              className="w-full"
              onClick={handleRevoke}
              disabled={loading}
            >
              <X className="h-4 w-4 mr-1" />
              Revoke link
            </Button>
          </>
        ) : (
          <Button className="w-full" size="sm" onClick={handleGenerate} disabled={loading}>
            Generate share link
          </Button>
        )}
        <p className="text-xs text-muted-foreground">
          Anyone with the link can view a read-only preview.
        </p>
      </PopoverContent>
    </Popover>
  );
}
```

> Requires: `npx shadcn add popover` if not present.

---

### Task 10: Add generateShareLink / revokeShareLink to ApiTemplateRepository

**Files:**
- Modify: `src/infrastructure/repositories/ApiTemplateRepository.ts`

```typescript
async generateShareLink(id: string): Promise<Template> {
  const res = await fetch(`/api/templates/${id}/share`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to generate share link");
  return res.json();
}

async revokeShareLink(id: string): Promise<Template> {
  const res = await fetch(`/api/templates/${id}/share`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to revoke share link");
  return res.json();
}
```

---

### Task 11: Create POST/DELETE /api/templates/[id]/share route

**Files:**
- Create: `src/app/api/templates/[id]/share/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { localTemplateService } from "@/config/services";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const template = await localTemplateService.generateShareLink(id);
    return NextResponse.json(template);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const template = await localTemplateService.revokeShareLink(id);
    return NextResponse.json(template);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

---

### Task 12: Wire ShareButton into editor toolbar

**Files:**
- Modify: `src/app/editor/[id]/page.tsx`

**Step 1: Read the current toolbar section**

**Step 2: Import and render ShareButton**

```tsx
import { ShareButton } from "@/components/organisms/Editor/ShareButton";

// In the toolbar (near the Export button):
<ShareButton
  templateId={templateId}
  initialShareId={template?.shareId}
/>
```

---

### Task 13: Manual test

**Step 1:** `npm run dev` → open any template in the editor

**Step 2:** Click "Share" → popover opens → click "Generate share link" → URL appears

**Step 3:** Copy the URL → open in a new incognito tab → verify read-only preview renders

**Step 4:** Back in editor, click "Revoke link" → verify the old URL now returns 404

---

### Task 14: Commit

```bash
git add src/domain/models/Template.ts \
        src/domain/repositories/TemplateRepository.ts \
        src/infrastructure/repositories/ \
        src/application/services/TemplateService.ts \
        src/app/api/templates/ \
        src/app/api/share/ \
        src/app/share/ \
        src/components/organisms/Editor/ShareButton.tsx \
        src/app/editor/
git commit -m "feat: add share link generation and public read-only preview"
```
