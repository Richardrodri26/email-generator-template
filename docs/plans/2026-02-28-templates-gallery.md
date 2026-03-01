# Templates Gallery — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Provide a curated gallery of starter templates (newsletter, transactional, onboarding, promotional) that users can browse and clone into their workspace with one click.

**Architecture:** Static starter templates are defined as `Template[]` in `src/infrastructure/data/starterTemplates.ts`. A `GalleryModal` (Shadcn Dialog) is triggered from the dashboard. Cloning calls `TemplateService.cloneFromGallery` which deep-copies the node tree with fresh IDs and saves under the user's `authorId`. No new repository port changes needed — reuses `saveTemplate`.

**Tech Stack:** React 19, Shadcn Dialog + Card + Badge, TanStack Query mutation, uuid, lucide-react

---

### Task 1: Create starter templates data

**Files:**
- Create: `src/infrastructure/data/starterTemplates.ts`

Each starter template needs a complete `TemplateData` tree. Start with 3 presets:

```typescript
import type { Template } from "@/domain/models/Template";

export const STARTER_TEMPLATES: Omit<Template, "id" | "authorId" | "createdAt" | "updatedAt">[] = [
  {
    name: "Newsletter",
    description: "A clean newsletter layout with header, content sections, and footer.",
    data: {
      rootNodeId: "root",
      nodes: {
        root: {
          id: "root",
          type: "ROOT",
          props: { style: { backgroundColor: "#f4f4f5", padding: "32px 0" } },
          children: ["header", "body", "footer"],
        },
        header: {
          id: "header",
          type: "CONTAINER",
          props: {
            style: {
              backgroundColor: "#18181b",
              padding: "24px 32px",
              textAlign: "center",
            },
          },
          children: ["logo"],
        },
        logo: {
          id: "logo",
          type: "TEXT",
          props: {
            text: "Your Brand",
            style: { color: "#ffffff", fontSize: "24px", fontWeight: "700" },
          },
          children: [],
        },
        body: {
          id: "body",
          type: "CONTAINER",
          props: {
            style: {
              backgroundColor: "#ffffff",
              padding: "32px",
              maxWidth: "600px",
              margin: "0 auto",
            },
          },
          children: ["headline", "divider1", "bodyText", "cta"],
        },
        headline: {
          id: "headline",
          type: "TEXT",
          props: {
            text: "Welcome to our newsletter",
            style: { fontSize: "28px", fontWeight: "700", color: "#18181b", marginBottom: "16px" },
          },
          children: [],
        },
        divider1: {
          id: "divider1",
          type: "DIVIDER",
          props: { style: { margin: "16px 0", borderColor: "#e4e4e7" } },
          children: [],
        },
        bodyText: {
          id: "bodyText",
          type: "TEXT",
          props: {
            text: "Here's what happened this week in the world of design and development. We curate the best content so you don't have to.",
            style: { fontSize: "16px", color: "#52525b", lineHeight: "1.7", marginBottom: "24px" },
          },
          children: [],
        },
        cta: {
          id: "cta",
          type: "BUTTON",
          props: {
            text: "Read more",
            href: "#",
            style: {
              backgroundColor: "#18181b",
              color: "#ffffff",
              padding: "12px 24px",
              borderRadius: "6px",
              fontSize: "14px",
              fontWeight: "600",
            },
          },
          children: [],
        },
        footer: {
          id: "footer",
          type: "CONTAINER",
          props: {
            style: {
              backgroundColor: "#f4f4f5",
              padding: "24px 32px",
              textAlign: "center",
            },
          },
          children: ["footerText"],
        },
        footerText: {
          id: "footerText",
          type: "TEXT",
          props: {
            text: "You're receiving this because you signed up. Unsubscribe anytime.",
            style: { fontSize: "12px", color: "#a1a1aa" },
          },
          children: [],
        },
      },
    },
  },
  {
    name: "Transactional — Order Confirmation",
    description: "Order confirmation email with order summary and support link.",
    data: {
      rootNodeId: "root",
      nodes: {
        root: {
          id: "root",
          type: "ROOT",
          props: { style: { backgroundColor: "#ffffff", padding: "32px" } },
          children: ["heading", "spacer1", "orderCard", "spacer2", "support"],
        },
        heading: {
          id: "heading",
          type: "TEXT",
          props: {
            text: "Order confirmed! 🎉",
            style: { fontSize: "32px", fontWeight: "700", color: "#18181b" },
          },
          children: [],
        },
        spacer1: {
          id: "spacer1",
          type: "SPACER",
          props: { height: 16 },
          children: [],
        },
        orderCard: {
          id: "orderCard",
          type: "CARD",
          props: {
            title: "Order #{{orderId}}",
            style: { borderColor: "#e4e4e7", padding: "20px", borderRadius: "8px" },
          },
          children: ["orderText"],
        },
        orderText: {
          id: "orderText",
          type: "TEXT",
          props: {
            text: "Hi {{name}}, your order has been confirmed and is being processed. You'll get another email when it ships.",
            style: { fontSize: "15px", color: "#52525b" },
          },
          children: [],
        },
        spacer2: {
          id: "spacer2",
          type: "SPACER",
          props: { height: 24 },
          children: [],
        },
        support: {
          id: "support",
          type: "TEXT",
          props: {
            text: "Questions? Contact support@yourcompany.com",
            style: { fontSize: "13px", color: "#a1a1aa", textAlign: "center" },
          },
          children: [],
        },
      },
    },
  },
  {
    name: "Onboarding — Welcome",
    description: "Welcome email for new users with getting-started steps.",
    data: {
      rootNodeId: "root",
      nodes: {
        root: {
          id: "root",
          type: "ROOT",
          props: { style: { backgroundColor: "#fafafa", padding: "40px 24px" } },
          children: ["hero", "steps", "spacer1", "cta"],
        },
        hero: {
          id: "hero",
          type: "TEXT",
          props: {
            text: "Welcome to the app, {{name}}! 👋",
            style: { fontSize: "30px", fontWeight: "800", color: "#18181b", marginBottom: "12px" },
          },
          children: [],
        },
        steps: {
          id: "steps",
          type: "CONTAINER",
          props: { style: { backgroundColor: "#ffffff", padding: "24px", borderRadius: "8px", marginBottom: "24px" } },
          children: ["step1", "step2", "step3"],
        },
        step1: {
          id: "step1",
          type: "TEXT",
          props: {
            text: "✅ Step 1: Complete your profile",
            style: { fontSize: "15px", color: "#18181b", marginBottom: "8px" },
          },
          children: [],
        },
        step2: {
          id: "step2",
          type: "TEXT",
          props: {
            text: "✅ Step 2: Connect your first integration",
            style: { fontSize: "15px", color: "#18181b", marginBottom: "8px" },
          },
          children: [],
        },
        step3: {
          id: "step3",
          type: "TEXT",
          props: {
            text: "✅ Step 3: Invite your team",
            style: { fontSize: "15px", color: "#18181b" },
          },
          children: [],
        },
        spacer1: {
          id: "spacer1",
          type: "SPACER",
          props: { height: 20 },
          children: [],
        },
        cta: {
          id: "cta",
          type: "BUTTON",
          props: {
            text: "Get started",
            href: "#",
            style: {
              backgroundColor: "#6366f1",
              color: "#ffffff",
              padding: "14px 28px",
              borderRadius: "8px",
              fontWeight: "700",
              fontSize: "15px",
            },
          },
          children: [],
        },
      },
    },
  },
];
```

**Step 1: Create the file with the data above**

**Step 2: Verify TypeScript is happy**

```bash
npx tsc --noEmit 2>&1 | head -20
```
Expected: No errors from this file.

---

### Task 2: Add cloneFromGallery to TemplateService

**Files:**
- Modify: `src/application/services/TemplateService.ts`

```typescript
async cloneFromGallery(
  starter: Omit<Template, "id" | "authorId" | "createdAt" | "updatedAt">,
  authorId: string
): Promise<Template> {
  // Deep-clone nodes with fresh IDs
  const idMap: Record<string, string> = {};
  const newNodes: Record<string, EditorNode> = {};

  for (const nodeId of Object.keys(starter.data.nodes)) {
    idMap[nodeId] = uuidv4();
  }

  for (const [oldId, node] of Object.entries(starter.data.nodes)) {
    newNodes[idMap[oldId]] = {
      ...node,
      id: idMap[oldId],
      children: node.children.map((c) => idMap[c] ?? c),
    };
  }

  const cloned: Template = {
    id: uuidv4(),
    name: starter.name,
    description: starter.description,
    authorId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    data: {
      rootNodeId: idMap[starter.data.rootNodeId],
      nodes: newNodes,
    },
  };

  await this.repository.saveTemplate(cloned);
  return cloned;
}
```

Add import at top:
```typescript
import type { EditorNode } from "@/domain/models/Template";
```

---

### Task 3: Add useCloneFromGalleryMutation

**Files:**
- Modify: `src/infrastructure/hooks/useTemplatesQuery.ts`

```typescript
import type { Template } from "@/domain/models/Template";
import { STARTER_TEMPLATES } from "@/infrastructure/data/starterTemplates";

export function useCloneFromGalleryMutation(
  service: TemplateService,
  userId?: string,
  queryKeyPrefix = ["templates"]
) {
  const queryClient = useQueryClient();
  const queryKey = userId ? [...queryKeyPrefix, userId] : queryKeyPrefix;

  return useMutation({
    mutationFn: async (
      starter: Omit<Template, "id" | "authorId" | "createdAt" | "updatedAt">
    ) => {
      if (!userId) throw new Error("User ID required");
      return service.cloneFromGallery(starter, userId);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });
}
```

---

### Task 4: Create GalleryModal component

**Files:**
- Create: `src/components/features/GalleryModal/GalleryModal.tsx`

```tsx
"use client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { STARTER_TEMPLATES } from "@/infrastructure/data/starterTemplates";
import type { Template } from "@/domain/models/Template";

interface Props {
  open: boolean;
  onClose: () => void;
  onClone: (starter: Omit<Template, "id" | "authorId" | "createdAt" | "updatedAt">) => void;
  isCloning?: boolean;
}

const CATEGORY_COLORS: Record<string, string> = {
  Newsletter: "blue",
  Transactional: "green",
  Onboarding: "purple",
};

export function GalleryModal({ open, onClose, onClone, isCloning }: Props) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Templates Gallery</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto py-2">
          {STARTER_TEMPLATES.map((t) => {
            const category = t.name.split("—")[0].trim().split(" ")[0];
            return (
              <Card key={t.name} className="flex flex-col">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-sm font-semibold">{t.name}</CardTitle>
                    <Badge variant="secondary" className="shrink-0 text-xs">
                      {category}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex-1">
                  <p className="text-xs text-muted-foreground">{t.description}</p>
                </CardContent>
                <CardFooter>
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={() => onClone(t)}
                    disabled={isCloning}
                  >
                    Use this template
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

---

### Task 5: Wire GalleryModal in dashboard

**Files:**
- Modify: `src/app/dashboard/page.tsx`

**Step 1: Read the current dashboard/page.tsx**

**Step 2: Add state and handler**

```tsx
const [galleryOpen, setGalleryOpen] = useState(false);
const cloneFromGalleryMutation = useCloneFromGalleryMutation(apiTemplateService, user?.id);

const handleCloneFromGallery = (starter: ...) => {
  cloneFromGalleryMutation.mutate(starter, {
    onSuccess: () => setGalleryOpen(false),
  });
};
```

**Step 3: Add "Start from gallery" button next to "New Template"**

```tsx
<Button variant="outline" onClick={() => setGalleryOpen(true)}>
  Start from gallery
</Button>
```

**Step 4: Render GalleryModal**

```tsx
<GalleryModal
  open={galleryOpen}
  onClose={() => setGalleryOpen(false)}
  onClone={handleCloneFromGallery}
  isCloning={cloneFromGalleryMutation.isPending}
/>
```

---

### Task 6: Manual test

**Step 1:** `npm run dev` → go to `/dashboard`

**Step 2:** Click "Start from gallery" → modal opens with 3 cards

**Step 3:** Click "Use this template" on Newsletter → modal closes, new row appears in table

**Step 4:** Open the cloned template in the editor → verify nodes exist

**Step 5:** Verify variables like `{{name}}` are visible in the text nodes

---

### Task 7: Commit

```bash
git add src/infrastructure/data/starterTemplates.ts \
        src/application/services/TemplateService.ts \
        src/infrastructure/hooks/useTemplatesQuery.ts \
        src/components/features/GalleryModal/ \
        src/app/dashboard/page.tsx
git commit -m "feat: add templates gallery with starter templates and clone action"
```
