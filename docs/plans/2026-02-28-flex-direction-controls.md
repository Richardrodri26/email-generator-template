# Flex Direction Controls — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Allow COLUMNS and CONTAINER nodes to toggle flex-direction (row ↔ column) and control gap, alignItems, and justifyContent.

**Architecture:** Purely PropertiesPanel + Canvas rendering change. No new stores or domain types. Props live in `node.props.style` which already supports arbitrary CSS. COLUMNS already renders as flex row; we expose controls to change direction.

**Tech Stack:** React 19, Zustand + Immer, Tailwind CSS 4, Shadcn/ui

---

### Task 1: Update CONTAINER default props

**Files:**
- Modify: `src/app/editor/[id]/page.tsx` (getDefaultProps function, around line 352)

**Step 1: Find getDefaultProps for CONTAINER**
In `editor/[id]/page.tsx`, find the `getDefaultProps` function's CONTAINER case and update it to include flex defaults:

```typescript
case 'CONTAINER': return {
  style: {
    paddingTop: '20px', paddingRight: '20px',
    paddingBottom: '20px', paddingLeft: '20px',
    backgroundColor: 'transparent',
    display: 'flex',
    flexDirection: 'column',
    gap: '0px',
    alignItems: 'stretch',
    justifyContent: 'flex-start',
  }
};
```

**Step 2: Commit**
```bash
git add src/app/editor/[id]/page.tsx
git commit -m "feat: add flex defaults to CONTAINER node getDefaultProps"
```

---

### Task 2: Add Layout Controls to PropertiesPanel

**Files:**
- Modify: `src/components/organisms/Editor/PropertiesPanel.tsx`

**Step 1: Add imports**
Add `ArrowRight, ArrowDown` to the lucide-react import at the top of the file.

**Step 2: Add Layout section for COLUMNS and CONTAINER**
Find the COLUMNS section in PropertiesPanel (or create one if missing). Add after the common size/padding controls, scoped to `(node.type === "COLUMNS" || node.type === "CONTAINER")`:

```tsx
{(node.type === "COLUMNS" || node.type === "CONTAINER") && (
  <div className="space-y-3 border-t border-border pt-3">
    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
      Layout
    </h3>

    {/* Direction */}
    <div>
      <Label className="text-xs text-muted-foreground mb-1 block">Direction</Label>
      <div className="flex gap-1">
        {(["row", "column"] as const).map((dir) => (
          <button
            key={dir}
            onClick={() => updateNodeProps(node.id, { style: { ...node.props.style, flexDirection: dir } })}
            className={`flex-1 h-9 rounded-md border text-xs font-medium transition-colors flex items-center justify-center gap-1.5 ${
              (node.props.style?.flexDirection || "row") === dir
                ? "bg-primary text-primary-foreground border-primary"
                : "border-input bg-transparent text-muted-foreground hover:bg-muted"
            }`}
          >
            {dir === "row"
              ? <><ArrowRight className="h-3.5 w-3.5" /> Horizontal</>
              : <><ArrowDown className="h-3.5 w-3.5" /> Vertical</>
            }
          </button>
        ))}
      </div>
    </div>

    {/* Gap */}
    <div>
      <Label className="text-xs text-muted-foreground mb-1 block">Gap</Label>
      <select
        value={node.props.style?.gap || "0px"}
        onChange={(e) => updateNodeProps(node.id, { style: { ...node.props.style, gap: e.target.value } })}
        className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
      >
        {["0px","4px","8px","12px","16px","20px","24px","32px","40px","48px"].map(g => (
          <option key={g} value={g}>{g}</option>
        ))}
      </select>
    </div>

    {/* Align Items */}
    <div>
      <Label className="text-xs text-muted-foreground mb-1 block">Align Items</Label>
      <select
        value={node.props.style?.alignItems || "stretch"}
        onChange={(e) => updateNodeProps(node.id, { style: { ...node.props.style, alignItems: e.target.value } })}
        className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
      >
        {["stretch","flex-start","center","flex-end","baseline"].map(v => (
          <option key={v} value={v}>{v}</option>
        ))}
      </select>
    </div>

    {/* Justify Content */}
    <div>
      <Label className="text-xs text-muted-foreground mb-1 block">Justify Content</Label>
      <select
        value={node.props.style?.justifyContent || "flex-start"}
        onChange={(e) => updateNodeProps(node.id, { style: { ...node.props.style, justifyContent: e.target.value } })}
        className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
      >
        {["flex-start","center","flex-end","space-between","space-around","space-evenly"].map(v => (
          <option key={v} value={v}>{v}</option>
        ))}
      </select>
    </div>
  </div>
)}
```

**Step 3: Commit**
```bash
git add src/components/organisms/Editor/PropertiesPanel.tsx
git commit -m "feat: add flex direction/gap/align controls to COLUMNS and CONTAINER properties"
```

---

### Task 3: Update Canvas CONTAINER rendering

**Files:**
- Modify: `src/components/organisms/Editor/Canvas.tsx`

**Step 1: Find CONTAINER case in the switch**
The CONTAINER case renders a `<SortableContext>` with a `<div>`. Update the inner div to use flex with the style values:

```tsx
case "CONTAINER":
  return wrapWithSelection(
    <SortableContext items={node.children} strategy={verticalListSortingStrategy}>
      <div style={{
        display: "flex",
        flexDirection: node.props.style?.flexDirection || "column",
        gap: node.props.style?.gap || "0px",
        alignItems: node.props.style?.alignItems || "stretch",
        justifyContent: node.props.style?.justifyContent || "flex-start",
        ...merged,
      }}>
        <ContainerChildren nodeId={nodeId} childIds={node.children} />
      </div>
    </SortableContext>
  );
```

**Step 2: Commit**
```bash
git add src/components/organisms/Editor/Canvas.tsx
git commit -m "feat: render CONTAINER as flex with direction/gap/align from props"
```

---

### Task 4: Update export pipeline for row-direction containers

**Files:**
- Modify: `src/application/useExportBuilder.tsx`

**Step 1: Find CONTAINER case in generateReactEmailElement**
Update it to use `<Row>/<Column>` for row-direction containers:

```tsx
case "CONTAINER": {
  const flexDir = node.props.style?.flexDirection || "column";
  const children = node.children.map((childId) => renderNode(childId));
  if (flexDir === "row") {
    return (
      <Row key={node.id} style={node.props.style}>
        {node.children.map((childId) => (
          <Column key={childId}>{renderNode(childId)}</Column>
        ))}
      </Row>
    );
  }
  return (
    <Section key={node.id} style={node.props.style}>
      {children}
    </Section>
  );
}
```

**Step 2: Commit**
```bash
git add src/application/useExportBuilder.tsx
git commit -m "feat: export row-direction CONTAINER as Row/Column in email HTML"
```

---

### Verification
1. `npm run dev` → Open editor
2. Drag a COLUMNS block → PropertiesPanel should show Layout section with Direction toggle
3. Toggle to "Vertical" → columns should stack vertically in canvas
4. Drag a CONTAINER → add elements inside → test direction/gap/align
5. Click "Export HTML" → open HTML in browser → verify layout is preserved
