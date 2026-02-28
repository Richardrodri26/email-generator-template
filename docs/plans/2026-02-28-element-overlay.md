# Element Overlay (Absolute Positioning) — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Toggle in PropertiesPanel switches any element to `position: absolute` with X, Y, Z-index inputs. Canvas renders it floating with a "floating" badge.

**Architecture:** No new stores or domain types. `position`, `left`, `top`, `zIndex` live in `node.props.style`. The Canvas `wrapWithSelection` function must respect these values instead of always using `position: relative`.

**Tech Stack:** React 19, Zustand + Immer, Shadcn Switch

---

### Task 1: Install Shadcn Switch (if not present)

```bash
npx shadcn add switch
git add components.json src/components/ui/switch.tsx
git commit -m "chore: add Shadcn Switch component"
```

---

### Task 2: Add Overlay Mode section to PropertiesPanel

**Files:**
- Modify: `src/components/organisms/Editor/PropertiesPanel.tsx`

**Step 1:** Add imports:
```tsx
import { Switch } from "@/components/ui/switch";
```

**Step 2:** Add Overlay Mode section for all non-ROOT nodes, near the top of the properties (after the header, before Size controls):

```tsx
{node.type !== "ROOT" && (
  <div className="space-y-3 border-b border-border pb-3">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs font-semibold">Overlay Mode</p>
        <p className="text-xs text-muted-foreground">Float element over others</p>
      </div>
      <Switch
        checked={node.props.style?.position === "absolute"}
        onCheckedChange={(checked) => {
          if (checked) {
            updateNodeProps(node.id, {
              style: {
                ...node.props.style,
                position: "absolute",
                left: "0px",
                top: "0px",
                zIndex: "10",
              },
            });
          } else {
            const newStyle = { ...node.props.style };
            delete newStyle.position;
            delete newStyle.left;
            delete newStyle.top;
            delete newStyle.zIndex;
            updateNodeProps(node.id, { style: newStyle });
          }
        }}
      />
    </div>

    {node.props.style?.position === "absolute" && (
      <div className="space-y-2 border border-border rounded-md p-3 bg-muted/20">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">X (left)</Label>
            <Input
              value={node.props.style?.left || "0px"}
              onChange={(e) => updateNodeProps(node.id, { style: { ...node.props.style, left: e.target.value } })}
              placeholder="0px"
              className="h-7 text-xs"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">Y (top)</Label>
            <Input
              value={node.props.style?.top || "0px"}
              onChange={(e) => updateNodeProps(node.id, { style: { ...node.props.style, top: e.target.value } })}
              placeholder="0px"
              className="h-7 text-xs"
            />
          </div>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground mb-1 block">Z-Index</Label>
          <Input
            type="number"
            value={node.props.style?.zIndex || "10"}
            onChange={(e) => updateNodeProps(node.id, { style: { ...node.props.style, zIndex: e.target.value } })}
            placeholder="10"
            className="h-7 text-xs"
          />
        </div>
      </div>
    )}
  </div>
)}
```

```bash
git add src/components/organisms/Editor/PropertiesPanel.tsx
git commit -m "feat: add Overlay Mode toggle with X/Y/Z-index controls to PropertiesPanel"
```

---

### Task 3: Update Canvas to render floating elements

**Files:**
- Modify: `src/components/organisms/Editor/Canvas.tsx`

**Step 1:** In `wrapWithSelection` (or wherever the node wrapper div is styled), find the `position: "relative"` hardcoding and update to:

```tsx
// The outer wrapper style for each node
const isAbsolute = node.props.style?.position === "absolute";

// In the style object:
style={{
  ...merged,
  position: isAbsolute ? "absolute" : "relative",
  ...(isAbsolute ? {
    left: merged.left || "0px",
    top: merged.top || "0px",
    zIndex: Number(merged.zIndex) || 10,
  } : {}),
}}
```

**Step 2:** Add "floating" badge to the node label (shown on hover/selection):
Find the label section inside the selection wrapper and add:
```tsx
{isAbsolute && (
  <span className="text-[9px] font-mono bg-yellow-100 text-yellow-700 border border-yellow-300 px-1 py-0.5 rounded ml-1">
    floating
  </span>
)}
```

```bash
git add src/components/organisms/Editor/Canvas.tsx
git commit -m "feat: render overlay elements with absolute positioning and floating badge"
```

---

### Verification
1. `npm run dev` → Open editor → Select any element
2. In PropertiesPanel → toggle "Overlay Mode" ON
3. Element should show "floating" badge and X/Y/Z-index inputs appear
4. Change X to "50px", Y to "100px" → element moves to that position
5. Toggle OFF → element returns to normal flow
6. Export HTML → verify position:absolute is in the output
