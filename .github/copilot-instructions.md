# GitHub Copilot Instructions

This is a visual email template builder — Next.js 16 App Router, React 19, TypeScript strict mode.

## Package Manager

Always use `bun`. Never suggest `npm install` or `yarn add`.

## Architecture — Hexagonal (Ports & Adapters)

Strict 4-layer rule. **Never** cross layer boundaries in the wrong direction.

```
domain/        → pure types + interfaces. Zero external imports.
infrastructure/ → implements domain interfaces (LocalStorage, Mock, API repos)
application/   → Zustand stores, services, hooks. Receives repos via DI only.
components/    → React UI. Consumes application stores directly.
app/           → Next.js routes + API handlers.
config/services.ts → ONLY place that instantiates repos and services (composition root).
```

Path alias: `@/*` → `src/*`

## Core Data Model

```typescript
// src/domain/models/Template.ts
type EditorNodeType =
  | "ROOT" | "TEXT" | "BUTTON" | "IMAGE" | "CONTAINER"
  | "DIVIDER" | "SPACER" | "COLUMNS" | "SOCIAL" | "CARD"
  | "TABLE" | "BADGE" | "CHART"

interface EditorNode {
  id: string
  type: EditorNodeType
  props: Record<string, any>   // styling + content merged
  children: string[]           // ordered child IDs
}

interface TemplateData {
  rootNodeId: string
  nodes: Record<string, EditorNode>  // flat dict, never nested
}
```

## State Management

| Store | File | Purpose |
|-------|------|---------|
| `useEditorStore` | `application/useEditorStore.ts` | Editor tree, selection, undo/redo (Zustand + Immer) |
| `useAuth` | `application/useAuth.ts` | Mock auth, persisted to localStorage |
| `useThemeStore` | `application/useThemeStore.ts` | light/dark theme |
| `usePresetsStore` | `application/usePresetsStore.ts` | Element presets array |

React Query manages template CRUD: `useTemplatesQuery`, `useCreateTemplateMutation`, `useDeleteTemplateMutation`, keyed by `["templates", userId]`.

## Key Files

- `src/components/organisms/Editor/Canvas.tsx` — renders each `EditorNodeType` via a switch
- `src/components/organisms/Editor/PropertiesPanel.tsx` — per-type property editors + Bookmark button
- `src/components/organisms/Editor/Sidebar.tsx` — BLOCKS array, DraggableBlock, DraggablePresetBlock
- `src/app/editor/[id]/page.tsx` — DndContext owner, `getDefaultProps()`, `NODE_ICONS`, `handleDragEnd`
- `src/application/useExportBuilder.tsx` — tree → @react-email → HTML

## Code Patterns

### Mutating editor state (always via Immer)
```typescript
// inside useEditorStore actions
updateNodeProp: (id, key, value) =>
  set(produce((state) => {
    state.present.nodes[id].props[key] = value
  }))
```

### Adding a new EditorNodeType
1. Add to `EditorNodeType` union in `domain/models/Template.ts`
2. Add `case` in `Canvas.tsx` `NodeRenderer` switch
3. Add section in `PropertiesPanel.tsx`
4. Add case in `useExportBuilder.tsx` `generateReactEmailElement`
5. Add `getDefaultProps` case in `editor/[id]/page.tsx`
6. Add to `BLOCKS` array in `Sidebar.tsx`
7. Add to `NODE_ICONS` in `editor/[id]/page.tsx`

### Export — CHART nodes
```typescript
// Canvas: interactive Recharts component
// Export: SVG → data URI → <Img>
const svg = renderToStaticMarkup(<RechartsComponent ... />)
const dataUri = `data:image/svg+xml;base64,${btoa(svg)}`
// embed as <Img src={dataUri} ... />
```

### Dark mode
- `useThemeStore` toggles `document.documentElement.classList` → `"dark"`
- `ThemeInitializer` in `providers.tsx` applies it on mount
- `layout.tsx` has `suppressHydrationWarning` on `<html>`
- Dark CSS variables live in `globals.css` under `.dark`

### API routes — validation pattern
```typescript
// Always validate with Zod, sanitize errors before sending 500s
const body = RequestSchema.safeParse(await req.json())
if (!body.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 })
```

## UI Conventions

- **Component library**: Shadcn/ui — style `new-york`, icons from `lucide-react`
- **Styling**: Tailwind CSS 4 — use `cn()` from `@/lib/utils` for conditional classes
- **No `var()` in className** — use Tailwind theme tokens
- **Drag-and-drop**: dnd-kit. `DndContext` lives in `editor/[id]/page.tsx`
- **Forms**: TanStack Form + Zod 4 for validation
- **Rate limiting**: TanStack Pacer (e.g., send-test-email: 3 req/min)

## What NOT to do

- Don't import from `infrastructure/` inside `application/` — use DI via `config/services.ts`
- Don't nest `EditorNode` objects — keep the flat dict, use child ID arrays
- Don't add `useMemo` / `useCallback` — React 19 Compiler handles this
- Don't use `npm` or `yarn` — use `bun`
- Don't create new files unless necessary — prefer editing existing ones
