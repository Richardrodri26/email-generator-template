# Email Generator Core Improvements Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement CSS Variable parsing for React Email, add 4 new email block components, and refactor the Drag & Drop system for high precision sorting and visual indicators.

**Architecture:**

1. A parser will convert Shadcn CSS strings into a Tailwind config for `<Tailwind>` in React Email.
2. The DND system will transition from basic dropzones to a nested `@dnd-kit/sortable` implementation with `<DragOverlay>`.
3. The component switch statements in `NodeRenderer` and `useExportBuilder` will be expanded for Divider, Spacer, Columns, and Social blocks.

**Tech Stack:** React, Next.js, `@dnd-kit/core`, `@dnd-kit/sortable`, `@react-email/components`, Tailwind CSS, Zustand.

---

### Task 1: CSS Parser Utility

**Files:**

- Create: `src/application/utils/cssParser.ts`
- Modify: `src/components/organisms/Editor/Canvas.tsx`
- Modify: `src/application/useExportBuilder.tsx`

**Step 1: Implement the CSS Parser**
Create `parseShadcnVariables` function in `cssParser.ts` that takes a CSS string (the `:root` / `.dark` text) and uses regex to extract `--key: value;` pairs into a standard Javascript Record/object.

**Step 2: Inject Scoped Global CSS in Canvas**
In `Canvas.tsx`, fetch the `themeCSS` from the current active theme, and render it in a `<style>` block scoped to the `.email-editor-preview` wrapper, ensuring the editor resolves colors natively.

**Step 3: Integrate with React Email Export**
In `useExportBuilder.tsx`, use the parser utility to convert the raw CSS into a `Tailwind` config object and pass it to `<Tailwind config={...}>`.

### Task 2: Extend Node Types & Sidebar

**Files:**

- Modify: `src/domain/models/Template.ts`
- Modify: `src/components/organisms/Editor/Sidebar.tsx`

**Step 1: Extend Types**
Add `"DIVIDER" | "SPACER" | "COLUMNS" | "SOCIAL"` to the `NodeType` union type in `Template.ts`.

**Step 2: Add sidebar draggable items**
Add the new components to the draggable palette in `Sidebar.tsx` (with appropriate default props, e.g., Spacer `height: 20px`).

### Task 3: Render New Components in Editor Canvas

**Files:**

- Modify: `src/components/organisms/Editor/Canvas.tsx`

**Step 1: Update NodeRenderer**
Add `case` statements for `DIVIDER`, `SPACER`, `COLUMNS`, and `SOCIAL` in the `NodeRenderer`. Implement basic div/layout structures for each to visually represent them in the editor.

### Task 4: Render New Components in Export Builder

**Files:**

- Modify: `src/application/useExportBuilder.tsx`

**Step 1: Add exporting logic**
Update the switch statement in `generateReactEmailElement` using `@react-email/components` (`Hr`, `<Container>` with height for Spacers, `<Section>`/`<Row>`/`<Column>` for layout, etc.).

### Task 5: Refactor to High-Precision Drag & Drop

**Files:**

- Modify: `src/components/organisms/Editor/index.tsx` (or where DndContext is located)
- Modify: `src/components/organisms/Editor/Canvas.tsx`
- Modify: `src/application/useEditorStore.tsx`

**Step 1: Add DragOverlay**
Implement `<DragOverlay>` inside the main `DndContext` provider to render a visual ghost of the active dragging element.

**Step 2: Implement SortableContext**
Wrap the children iterations in `Canvas.tsx` (the containers) with `<SortableContext items={node.children}>` to enable reordering within the container. Wrap each `NodeRenderer` item with `useSortable` instead of generic `useDraggable`/`useDroppable`.

**Step 3: Visual Insertion Lines**
In `NodeRenderer`, use the `isOver`, `isDragging` flags from `useSortable` to conditionally render styled borders (e.g., `border-b-2 border-orange-500`) when an item is being hovered over its drop edge.

**Step 4: Update Zustand Store Handlers**
Update `handleDragEnd` in `useEditorStore` (or wherever it resides) to support repositioning logic (reordering siblings within the same parent array) rather than just appending to the end of a container array. Use `arrayMove` from `@dnd-kit/sortable` if possible.
