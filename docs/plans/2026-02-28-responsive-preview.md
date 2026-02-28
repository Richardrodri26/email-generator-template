# Responsive Preview — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a Desktop/Tablet/Mobile width toggle in the canvas toolbar AND a full-screen preview modal with device frames.

**Architecture:** New `usePreviewStore` (Zustand) drives canvas width. `DeviceToggle` component sits in the editor toolbar. `PreviewModal` (Dialog) renders the email at device width using a scaled div. Canvas consumes the store to set `maxWidth`.

**Tech Stack:** React 19, Zustand, Shadcn Dialog, lucide-react icons

---

### Task 1: Create usePreviewStore

**Files:**
- Create: `src/application/usePreviewStore.ts`

```typescript
import { create } from "zustand";

export type PreviewDevice = "desktop" | "tablet" | "mobile";

interface PreviewState {
  device: PreviewDevice;
  setDevice: (d: PreviewDevice) => void;
  modalOpen: boolean;
  setModalOpen: (open: boolean) => void;
}

export const DEVICE_WIDTHS: Record<PreviewDevice, number> = {
  desktop: 600,
  tablet: 480,
  mobile: 375,
};

export const usePreviewStore = create<PreviewState>((set) => ({
  device: "desktop",
  setDevice: (device) => set({ device }),
  modalOpen: false,
  setModalOpen: (modalOpen) => set({ modalOpen }),
}));
```

```bash
git add src/application/usePreviewStore.ts
git commit -m "feat: add usePreviewStore for responsive preview state"
```

---

### Task 2: Create DeviceToggle component

**Files:**
- Create: `src/components/organisms/Editor/DeviceToggle.tsx`

```tsx
"use client";
import { Monitor, Tablet, Smartphone } from "lucide-react";
import { usePreviewStore, PreviewDevice, DEVICE_WIDTHS } from "@/application/usePreviewStore";

const DEVICES: { id: PreviewDevice; icon: React.ElementType; label: string }[] = [
  { id: "desktop", icon: Monitor, label: "Desktop (600px)" },
  { id: "tablet", icon: Tablet, label: "Tablet (480px)" },
  { id: "mobile", icon: Smartphone, label: "Mobile (375px)" },
];

export function DeviceToggle() {
  const { device, setDevice } = usePreviewStore();
  return (
    <div className="flex items-center gap-1 border border-border rounded-md p-0.5 bg-muted/40">
      {DEVICES.map(({ id, icon: Icon, label }) => (
        <button
          key={id}
          title={label}
          onClick={() => setDevice(id)}
          className={
            device === id
              ? "bg-background text-foreground shadow-xs rounded px-2 py-1"
              : "text-muted-foreground hover:text-foreground px-2 py-1 rounded"
          }
        >
          <Icon className="h-4 w-4" />
        </button>
      ))}
    </div>
  );
}
```

```bash
git add src/components/organisms/Editor/DeviceToggle.tsx
git commit -m "feat: add DeviceToggle component for canvas width switching"
```

---

### Task 3: Update Canvas to consume preview width

**Files:**
- Modify: `src/components/organisms/Editor/Canvas.tsx`

**Step 1:** Add import at top:
```tsx
import { usePreviewStore, DEVICE_WIDTHS } from "@/application/usePreviewStore";
```

**Step 2:** Inside `EditorCanvas`, before the return:
```tsx
const { device } = usePreviewStore();
const previewWidth = DEVICE_WIDTHS[device];
```

**Step 3:** Find the `.email-editor-preview` wrapper div and change from a fixed `max-w-[600px]` class to an inline style:
```tsx
<div
  style={{ maxWidth: previewWidth, transition: "max-width 300ms ease" }}
  className="w-full min-h-96 bg-background shadow-xl rounded-sm email-editor-preview flex flex-col relative group/canvas"
>
```
(Remove any `max-w-*` Tailwind class that was there before)

```bash
git add src/components/organisms/Editor/Canvas.tsx
git commit -m "feat: canvas width driven by usePreviewStore device selection"
```

---

### Task 4: Create PreviewModal component

**Files:**
- Create: `src/components/organisms/Editor/PreviewModal.tsx`

First install Shadcn dialog if not present: `npx shadcn add dialog`

```tsx
"use client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { usePreviewStore, DEVICE_WIDTHS } from "@/application/usePreviewStore";
import { useEditorStore } from "@/application/useEditorStore";
import { generateReactEmailElement } from "@/application/useExportBuilder";
import { Monitor, Tablet, Smartphone } from "lucide-react";

const DEVICE_ICONS = { desktop: Monitor, tablet: Tablet, mobile: Smartphone };
const DEVICE_LABELS = { desktop: "Desktop — 600px", tablet: "Tablet — 480px", mobile: "Mobile — 375px" };

interface PreviewModalProps {
  themeCSS: string;
}

export function PreviewModal({ themeCSS }: PreviewModalProps) {
  const { modalOpen, setModalOpen, device, setDevice } = usePreviewStore();
  const data = useEditorStore((s) => s.data);
  const width = DEVICE_WIDTHS[device];

  const emailElement = generateReactEmailElement(data, themeCSS);

  return (
    <Dialog open={modalOpen} onOpenChange={setModalOpen}>
      <DialogContent className="max-w-5xl w-full h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Email Preview</DialogTitle>
            <div className="flex items-center gap-1 border border-border rounded-md p-0.5 bg-muted/40">
              {(["desktop", "tablet", "mobile"] as const).map((d) => {
                const Icon = DEVICE_ICONS[d];
                return (
                  <button
                    key={d}
                    title={DEVICE_LABELS[d]}
                    onClick={() => setDevice(d)}
                    className={
                      device === d
                        ? "bg-background text-foreground shadow-xs rounded px-2 py-1"
                        : "text-muted-foreground hover:text-foreground px-2 py-1 rounded"
                    }
                  >
                    <Icon className="h-4 w-4" />
                  </button>
                );
              })}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">{DEVICE_LABELS[device]}</p>
        </DialogHeader>

        <div className="flex-1 overflow-auto flex items-start justify-center bg-muted/30 rounded-md p-6">
          <div
            style={{ width, transition: "width 300ms ease" }}
            className="bg-white shadow-xl rounded-sm overflow-hidden min-h-40"
          >
            <div className="email-editor-preview">
              {emailElement}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

```bash
git add src/components/organisms/Editor/PreviewModal.tsx
git commit -m "feat: add PreviewModal with device frame switching"
```

---

### Task 5: Wire DeviceToggle and PreviewModal to editor page

**Files:**
- Modify: `src/app/editor/[id]/page.tsx`

**Step 1:** Add imports:
```tsx
import { DeviceToggle } from "@/components/organisms/Editor/DeviceToggle";
import { PreviewModal } from "@/components/organisms/Editor/PreviewModal";
import { usePreviewStore } from "@/application/usePreviewStore";
import { Eye } from "lucide-react";
```

**Step 2:** In the header toolbar div (where Export HTML and Save Template buttons are), add:
```tsx
<DeviceToggle />
<Button
  size="sm"
  variant="outline"
  onClick={() => usePreviewStore.getState().setModalOpen(true)}
>
  <Eye className="h-4 w-4 mr-2" /> Preview
</Button>
```

**Step 3:** Before the closing `</div>` of the page return, add:
```tsx
<PreviewModal themeCSS={themeCSS} />
```

```bash
git add src/app/editor/[id]/page.tsx
git commit -m "feat: add DeviceToggle and Preview button to editor toolbar"
```

---

### Verification
1. `npm run dev` → Open any template in editor
2. Click Monitor/Tablet/Phone icons → canvas width should animate to 600/480/375px
3. Click "Preview" button → modal opens with email rendered
4. Toggle devices inside modal → width changes
5. Close modal → returns to editor
