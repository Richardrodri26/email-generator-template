# Test Email via Resend — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Let users enter a Resend API key (stored in browser localStorage), a recipient email, and send a test version of the current email template.

**Architecture:** Resend API key stored in Zustand + persist (localStorage). Per-request, the key is sent in the POST body to a Next.js API route (`/api/send-test-email`) which instantiates Resend and sends the email. The key never persists server-side.

**Tech Stack:** Next.js API routes, Resend SDK, Zustand + persist, Shadcn Dialog

---

### Task 1: Install Resend SDK

```bash
bun add resend
git add bun.lock package.json
git commit -m "chore: add resend SDK"
```

---

### Task 2: Create API route

**Files:**
- Create: `src/app/api/send-test-email/route.ts`

```typescript
import { NextResponse } from "next/server";
import { Resend } from "resend";

export async function POST(request: Request) {
  const { apiKey, to, subject, html } = await request.json();

  if (!apiKey || !to || !html) {
    return NextResponse.json(
      { error: "Missing apiKey, to, or html" },
      { status: 400 }
    );
  }

  const resend = new Resend(apiKey);

  try {
    const { data, error } = await resend.emails.send({
      from: "MailGen Preview <onboarding@resend.dev>",
      to: [to],
      subject: subject || "Email Preview — MailGen",
      html,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 422 });
    }

    return NextResponse.json({ success: true, id: data?.id });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

```bash
git add src/app/api/send-test-email/route.ts
git commit -m "feat: add /api/send-test-email route using Resend SDK"
```

---

### Task 3: Create useTestEmailStore

**Files:**
- Create: `src/application/useTestEmailStore.ts`

```typescript
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface TestEmailState {
  resendApiKey: string;
  setResendApiKey: (key: string) => void;
}

export const useTestEmailStore = create<TestEmailState>()(
  persist(
    (set) => ({
      resendApiKey: "",
      setResendApiKey: (resendApiKey) => set({ resendApiKey }),
    }),
    { name: "mailgen-test-email" }
  )
);
```

```bash
git add src/application/useTestEmailStore.ts
git commit -m "feat: add useTestEmailStore with persisted Resend API key"
```

---

### Task 4: Create TestEmailDialog component

**Files:**
- Create: `src/components/organisms/Editor/TestEmailDialog.tsx`

Install Dialog if not present: `npx shadcn add dialog`

```tsx
"use client";
import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Send } from "lucide-react";
import { useTestEmailStore } from "@/application/useTestEmailStore";

interface TestEmailDialogProps {
  getHtml: () => Promise<string>;
}

export function TestEmailDialog({ getHtml }: TestEmailDialogProps) {
  const { resendApiKey, setResendApiKey } = useTestEmailStore();
  const [to, setTo] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [open, setOpen] = useState(false);

  const handleSend = async () => {
    setSending(true);
    setResult(null);
    try {
      const html = await getHtml();
      const res = await fetch("/api/send-test-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: resendApiKey,
          to,
          subject: "Test Email — MailGen",
          html,
        }),
      });
      const json = await res.json();
      if (json.error) {
        setResult({ ok: false, message: json.error });
      } else {
        setResult({ ok: true, message: "Email sent successfully!" });
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Unknown error";
      setResult({ ok: false, message });
    }
    setSending(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Send className="h-4 w-4 mr-2" /> Send Test
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Send Test Email via Resend</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Resend API Key</Label>
            <Input
              type="password"
              value={resendApiKey}
              onChange={(e) => setResendApiKey(e.target.value)}
              placeholder="re_xxxxxxxxxx"
            />
            <p className="text-[10px] text-muted-foreground">
              Stored in your browser only. Sent per-request to generate the email.
              Get your key at resend.com/api-keys
            </p>
          </div>
          <div className="space-y-2">
            <Label>Recipient Email</Label>
            <Input
              type="email"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
          {result && (
            <p className={`text-sm ${result.ok ? "text-green-600" : "text-red-500"}`}>
              {result.message}
            </p>
          )}
          <Button
            onClick={handleSend}
            disabled={sending || !resendApiKey || !to}
            className="w-full"
          >
            {sending ? "Sending..." : "Send Test Email"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

```bash
git add src/components/organisms/Editor/TestEmailDialog.tsx
git commit -m "feat: add TestEmailDialog component with Resend API key input"
```

---

### Task 5: Add TestEmailDialog to editor toolbar

**Files:**
- Modify: `src/app/editor/[id]/page.tsx`

**Step 1:** Add import:
```tsx
import { TestEmailDialog } from "@/components/organisms/Editor/TestEmailDialog";
```

**Step 2:** In the header toolbar, add:
```tsx
<TestEmailDialog
  getHtml={async () => generateHtmlExport(currentData, themeCSS)}
/>
```

```bash
git add src/app/editor/[id]/page.tsx
git commit -m "feat: add Send Test button to editor toolbar"
```

---

### Verification
1. `npm run dev` → Create a template with some content
2. Click "Send Test" → dialog opens
3. Enter a valid Resend API key + recipient email
4. Click "Send Test Email" → success message
5. Check recipient inbox → email received with correct content
6. Test with invalid API key → error message shown
