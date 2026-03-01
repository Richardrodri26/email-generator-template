# Responsive Preview v2 — iFrame-Based Email Client Simulation — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the scaled-div preview approach with a real iFrame that renders the exported HTML at exact device pixel widths, simulating how major email clients display the email. Add email-client presets (Gmail web, Outlook 2021, Apple Mail, iPhone 14).

**Architecture:** The existing `PreviewModal` uses a scaled container. We replace it with an `<iframe srcDoc={html}>` approach — the iframe gets the actual exported HTML string injected via `srcDoc`, rendered at the target width, with the modal container showing a device chrome frame around it. `useExportBuilder` already exposes `generateHtmlExport` — we extract a `generateHtmlString` helper from it (no download, just return the string). A new `CLIENT_PRESETS` config maps client names to widths and injects specific viewport meta tags.

**Tech Stack:** React 19, useRef + useEffect for iframe messaging (for height), Shadcn Dialog + Tabs, existing `useExportBuilder`, Tailwind

> **Note:** `usePreviewStore`, `DeviceToggle`, and `PreviewModal` already exist. This plan upgrades PreviewModal to use a real iFrame and adds email-client presets.

---

### Task 1: Extract generateHtmlString from useExportBuilder

**Files:**
- Modify: `src/application/useExportBuilder.tsx`

**Step 1: Read the current file to understand generateHtmlExport**

**Step 2: Extract a pure async function (or expose from the hook) that returns the HTML string without triggering a download**

The hook likely calls `render(...)` and then creates a Blob download. We want just the string:

```typescript
// Add this export alongside generateHtmlExport:
export async function generateHtmlString(
  data: TemplateData,
  themeCSS: string
): Promise<string> {
  const element = generateReactEmailElement(data, themeCSS);
  return render(element, { pretty: true });
}
```

If `generateReactEmailElement` and `render` are already in scope in that file, this is straightforward. Adapt as needed.

---

### Task 2: Define email client presets

**Files:**
- Create: `src/application/utils/emailClientPresets.ts`

```typescript
export interface EmailClientPreset {
  id: string;
  label: string;
  width: number;          // px
  icon: string;           // emoji or label abbreviation
  description: string;
  /**
   * Optional extra <head> content injected into the preview iframe.
   * Use to simulate client-specific rendering quirks.
   */
  extraHead?: string;
}

export const EMAIL_CLIENT_PRESETS: EmailClientPreset[] = [
  {
    id: "gmail-web",
    label: "Gmail (web)",
    width: 600,
    icon: "G",
    description: "Standard Gmail web client — 600px container width",
  },
  {
    id: "outlook-2021",
    label: "Outlook 2021",
    width: 600,
    icon: "O",
    description: "Outlook 2021 desktop — 600px, limited CSS support",
    extraHead: `<style>
      /* Outlook ignores max-width on tables. Simulate by capping body */
      body { max-width: 600px; margin: 0 auto; }
    </style>`,
  },
  {
    id: "apple-mail",
    label: "Apple Mail",
    width: 700,
    icon: "A",
    description: "Apple Mail desktop — wider viewport, full CSS support",
  },
  {
    id: "iphone-15",
    label: "iPhone 15",
    width: 390,
    icon: "📱",
    description: "iPhone 15 viewport — 390px logical width",
    extraHead: `<meta name="viewport" content="width=390, initial-scale=1">`,
  },
  {
    id: "android",
    label: "Android (Gmail app)",
    width: 360,
    icon: "📱",
    description: "Android Gmail app — 360px viewport",
    extraHead: `<meta name="viewport" content="width=360, initial-scale=1">`,
  },
];
```

---

### Task 3: Create IFramePreview component

**Files:**
- Create: `src/components/organisms/Editor/IFramePreview.tsx`

This component receives the HTML string and renders it inside an iframe at the specified width. It uses `postMessage` from a resize observer script injected in the iframe head to auto-size the iframe height.

```tsx
"use client";
import { useRef, useEffect } from "react";

interface Props {
  html: string;
  width: number;
  extraHead?: string;
  className?: string;
}

/**
 * Injects a small script into the iframe that reports its document height
 * back to the parent via postMessage so we can auto-size the iframe.
 */
const HEIGHT_REPORTER = `
<script>
  function reportHeight() {
    const h = document.body ? document.body.scrollHeight : 0;
    window.parent.postMessage({ type: 'iframe-height', height: h }, '*');
  }
  window.addEventListener('load', reportHeight);
  new ResizeObserver(reportHeight).observe(document.body);
</script>
`;

export function IFramePreview({ html, width, extraHead = "", className }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Inject the height reporter script into the html head
  const srcDoc = html.replace(
    "</head>",
    `${extraHead}${HEIGHT_REPORTER}</head>`
  );

  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data?.type === "iframe-height" && iframeRef.current) {
        iframeRef.current.style.height = `${e.data.height}px`;
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return (
    <iframe
      ref={iframeRef}
      srcDoc={srcDoc}
      style={{ width: `${width}px`, minHeight: "400px", border: "none" }}
      className={className}
      title="Email preview"
      sandbox="allow-same-origin allow-scripts"
    />
  );
}
```

---

### Task 4: Rewrite PreviewModal to use IFramePreview + client presets

**Files:**
- Modify: `src/components/organisms/Editor/PreviewModal.tsx`

**Step 1: Read the current PreviewModal**

**Step 2: Rewrite to:**
1. Generate HTML string on open using `generateHtmlString`
2. Show a preset selector (horizontal tab list or button group)
3. Render `IFramePreview` at the selected preset width
4. Center the iframe inside a scrollable container with a subtle device-width indicator

```tsx
"use client";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { usePreviewStore } from "@/application/usePreviewStore";
import { useEditorStore } from "@/application/useEditorStore";
import { useThemeStore } from "@/application/useThemeStore";
import { generateHtmlString } from "@/application/useExportBuilder";
import { IFramePreview } from "./IFramePreview";
import {
  EMAIL_CLIENT_PRESETS,
  type EmailClientPreset,
} from "@/application/utils/emailClientPresets";

export function PreviewModal() {
  const { modalOpen, setModalOpen } = usePreviewStore();
  const present = useEditorStore((s) => s.present); // adapt to actual field name
  const themeCSS = useThemeStore((s) => s.themeCSS); // adapt to actual field name

  const [html, setHtml] = useState<string | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<EmailClientPreset>(
    EMAIL_CLIENT_PRESETS[0]
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!modalOpen) return;
    setLoading(true);
    generateHtmlString(present, themeCSS ?? "")
      .then(setHtml)
      .finally(() => setLoading(false));
  }, [modalOpen, present, themeCSS]);

  return (
    <Dialog open={modalOpen} onOpenChange={setModalOpen}>
      <DialogContent className="max-w-[95vw] w-full max-h-[95vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-4 pb-0 shrink-0">
          <DialogTitle>Preview</DialogTitle>
        </DialogHeader>

        {/* Client preset selector */}
        <div className="flex gap-2 px-4 pt-3 pb-2 border-b shrink-0 overflow-x-auto">
          {EMAIL_CLIENT_PRESETS.map((preset) => (
            <Button
              key={preset.id}
              variant={selectedPreset.id === preset.id ? "default" : "outline"}
              size="sm"
              className="shrink-0"
              title={preset.description}
              onClick={() => setSelectedPreset(preset)}
            >
              <span className="mr-1 text-xs">{preset.icon}</span>
              {preset.label}
              <span className="ml-1.5 text-xs opacity-60">{preset.width}px</span>
            </Button>
          ))}
        </div>

        {/* Preview area */}
        <div className="flex-1 overflow-auto bg-muted p-6">
          <div className="flex justify-center">
            {loading && (
              <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
                Generating preview...
              </div>
            )}
            {!loading && html && (
              <div className="bg-white shadow-xl rounded-sm overflow-hidden">
                <IFramePreview
                  html={html}
                  width={selectedPreset.width}
                  extraHead={selectedPreset.extraHead}
                />
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

---

### Task 5: Update DeviceToggle (optional cleanup)

**Files:**
- Modify: `src/components/organisms/Editor/DeviceToggle.tsx`

**Step 1: Read the current DeviceToggle**

The DeviceToggle was controlling canvas width. Now that we have proper iFrame preview, consider:
- **Option A:** Keep DeviceToggle for canvas width (useful for editing in responsive context) — no change needed.
- **Option B:** Remove DeviceToggle and replace the toolbar button with just "Preview" → opens PreviewModal.

If Option B, remove the DEVICE_WIDTHS logic from usePreviewStore and simplify. Only do this if it doesn't break anything else.

> **Recommendation:** Keep DeviceToggle as-is. The canvas width toggle is still useful during editing.

---

### Task 6: Manual test

**Step 1:** `npm run dev` → open a template in the editor

**Step 2:** Click "Preview" → modal opens

**Step 3:** Verify HTML renders inside the iframe (not a scaled div)

**Step 4:** Click "iPhone 15" preset → iframe shrinks to 390px, layout adapts

**Step 5:** Click "Outlook 2021" → verify the extra `<style>` is applied

**Step 6:** Scroll the preview to check the iframe auto-sizes to full content height

**Step 7:** Close and reopen → new HTML is regenerated

---

### Task 7: Commit

```bash
git add src/application/useExportBuilder.tsx \
        src/application/utils/emailClientPresets.ts \
        src/components/organisms/Editor/IFramePreview.tsx \
        src/components/organisms/Editor/PreviewModal.tsx
git commit -m "feat: preview v2 - iframe rendering with email client presets"
```
