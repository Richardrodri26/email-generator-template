# PDF Export (Client-Side) — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Export the current email canvas as a PDF entirely in the browser using html2canvas + jsPDF. No server required — works on Vercel Hobby/Pro without limitations.

**Architecture:** `html2canvas` captures the `.email-editor-preview` DOM node as a canvas bitmap. `jsPDF` converts the canvas to a PDF and triggers browser download. Everything runs client-side in `editor/[id]/page.tsx`. No API routes needed.

**Tech Stack:** html2canvas, jsPDF (both client-side, no server)

> **Future migration note:** When the NestJS backend is ready, replace this with a `/pdf` endpoint that uses Puppeteer for pixel-perfect rendering. The button and handler in `page.tsx` will be the only thing to update.

---

### Task 1: Install packages

```bash
bun add html2canvas jspdf
bun add -d @types/html2canvas
```

```bash
git add bun.lock package.json
git commit -m "chore: add html2canvas and jspdf for client-side PDF export"
```

---

### Task 2: Add "Export PDF" button and handler to editor toolbar

**Files:**
- Modify: `src/app/editor/[id]/page.tsx`

**Step 1:** Add imports (dynamic import to avoid SSR issues — html2canvas needs the DOM):
```tsx
import { FileText } from "lucide-react";
```

**Step 2:** Add state:
```tsx
const [isExportingPdf, setIsExportingPdf] = useState(false);
```

**Step 3:** Add handler using dynamic imports (avoids SSR window errors):
```tsx
const handleExportPdf = async () => {
  setIsExportingPdf(true);
  try {
    const canvasEl = document.querySelector(".email-editor-preview") as HTMLElement;
    if (!canvasEl) throw new Error("Canvas element not found");

    // Dynamic import so these only load in the browser
    const html2canvas = (await import("html2canvas")).default;
    const { jsPDF } = await import("jspdf");

    const capturedCanvas = await html2canvas(canvasEl, {
      scale: 2,           // 2x for crisp PDF
      useCORS: true,      // allow external images
      logging: false,
      backgroundColor: "#ffffff",
    });

    const imgData = capturedCanvas.toDataURL("image/png");
    const pdfWidth = capturedCanvas.width / 2;   // undo the 2x scale
    const pdfHeight = capturedCanvas.height / 2;

    const pdf = new jsPDF({
      orientation: pdfWidth > pdfHeight ? "landscape" : "portrait",
      unit: "px",
      format: [pdfWidth, pdfHeight],
    });

    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save(`template-${id}.pdf`);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "PDF export failed";
    alert(message);
  }
  setIsExportingPdf(false);
};
```

**Step 4:** Add button in the toolbar header:
```tsx
<Button size="sm" variant="outline" onClick={handleExportPdf} disabled={isExportingPdf}>
  <FileText className="h-4 w-4 mr-2" />
  {isExportingPdf ? "Generating PDF..." : "Export PDF"}
</Button>
```

```bash
git add src/app/editor/[id]/page.tsx
git commit -m "feat: add client-side PDF export using html2canvas + jsPDF"
```

---

### Verification
1. `npm run dev` → Open any template in editor
2. Click "Export PDF" → button shows "Generating PDF..."
3. PDF downloads automatically → open in PDF viewer
4. Verify layout matches what's visible in the canvas
5. Test with images in the template → verify CORS doesn't block them (use `useCORS: true`)
