# Email Generator Core Improvements Design

**Date:** 2026-02-22  
**Context:** Improving the core capabilities of the Email Template Generator.

## 1. Architecture & CSS Injection Strategy

React Email does not support direct CSS variables like `var(--background)` reliably across mail clients (especially ones utilizing complex color functions like `oklch()`).

**Proposed Flow:**

1. **Parser Utility:** A new utility `parseShadcnVariables(cssString: string)` will extract the variable names and their values from the raw CSS text saved in LocalStorage.
2. **Editor Context:** In the Editor preview (`Canvas.tsx`), we will inject a dynamic `<style>` block scoped to a wrapper class `.email-editor-preview` so that the variables resolve natively in the browser while editing.
3. **Export Engine:** In `useExportBuilder.tsx`, we will map the parsed CSS variables into a Tailwind config object. React Email's `<Tailwind>` provider accepts a `config` prop where we can extend `theme.colors` with our parsed `oklch` values. This guarantees inline styles (e.g., `style="background-color: oklch(...)"`) in the final HTML output.

## 2. New Components Palette

We will expand the component system (`NodeRenderer.tsx` and the Drag&Drop Toolbar) to include:

- **Divider (`DIVIDER`):** A customizable horizontal rule component (`<Hr>` in React Email).
- **Spacer (`SPACER`):** A vertical block with a configurable height property.
- **Columns (`COLUMNS`):** A two-column or three-column layout section that gracefully degrades to stacked rows on mobile clients.
- **Social Links (`SOCIAL`):** Standard social media icon blocks.

Each of these will require updates to:

- `TemplateData` enum types (`NodeType`).
- `NodeRenderer.tsx` switch statement to visually render them.
- `useExportBuilder.tsx` to handle the React Email specific conversion.
- `Sidebar.tsx` (or toolbar equivalent) to allow the user to drag them into the canvas.

## 3. High-Precision Drag & Drop (dnd-kit)

The current DND implementation relies on simple `useDroppable` areas which provide limited accuracy, especially with deeply nested containers.

**Upgrades:**

1. **Sortable Context:** We will wrap container children in `@dnd-kit/sortable` contexts. This moves us from a simple "drop in a bucket" approach to list-based sorting.
2. **Visual Indicators:** We will implement an insertion line (e.g., a blue/orange bar) appearing _between_ nodes when dragging, clarifying exactly where a block is going to land.
3. **Drag Overlays:** We will use `<DragOverlay>` to provide a visual representation of the node being dragged, rather than relying on default browser ghosting.
4. **Collision Detection:** We will tune the collision detection algorithm (likely a custom composite of `closestCenter` and pointer intersections) to heavily prioritize placing items between siblings rather than continually trying to nest them inside each other.

---

_Status: Approved by User._
