# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
bun run dev      # Start dev server (Next.js with Turbopack)
bun run build    # Production build
bun run start    # Start production server
bun run lint     # Run ESLint
```

Add Shadcn components: `npx shadcn add <component>`

**Package manager**: always use `bun`, not `npm` or `yarn`.

## Architecture

This project follows **Hexagonal Architecture** (Ports & Adapters) with a strict 4-layer separation:

```
src/
├── domain/          # Pure types + repository interfaces — no external deps
├── infrastructure/  # Concrete implementations (LocalStorage, Mock, API, React Query hooks)
├── application/     # Business logic: services, Zustand stores, custom hooks
├── components/      # UI: organisms/, features/, ui/ (Shadcn), providers.tsx
├── config/          # services.ts: service instantiation (DI composition root)
└── app/             # Next.js App Router: routes + API endpoints
```

### Layer Rules
- **Domain** defines the shapes (`Template`, `EditorNode`, `User`) and interfaces (`TemplateRepository`, `UserRepository`). No imports from other layers.
- **Infrastructure** implements domain interfaces. Three template repo strategies: `LocalStorageTemplateRepository` (client/dashboard), `MockTemplateRepository` (server/SSR), `ApiTemplateRepository` (client → API route).
- **Application** wires repos into services (`TemplateService`) and exposes Zustand stores + convenience hooks. Never imports infrastructure directly — always receives it via DI from `config/services.ts`.
- **Config** (`src/config/services.ts`) is the composition root: it creates the three pre-wired service instances (`localTemplateService`, `serverTemplateService`, `apiTemplateService`).

### Template Data Model

The core data structure is a **flattened tree** stored in a dictionary:

```typescript
// domain/models/Template.ts
TemplateData {
  rootNodeId: string
  nodes: Record<string, EditorNode>   // flat map, IDs as keys
}

EditorNode {
  id: string
  type: EditorNodeType                // see all 13 types below
  props: Record<string, any>          // styling + content merged
  children: string[]                  // ordered child IDs
}
```

**All 13 `EditorNodeType` values**: `ROOT | TEXT | BUTTON | IMAGE | CONTAINER | DIVIDER | SPACER | COLUMNS | SOCIAL | CARD | TABLE | BADGE | CHART`

The tree is traversed recursively by `Canvas.tsx` and `useExportBuilder.tsx`. All mutations go through `useEditorStore` (Zustand + Immer), which also maintains an undo/redo history stack.

### State Management
- **`useEditorStore`** (Zustand + Immer): editor tree state, selection, full undo/redo history.
- **`useAuth`** (Zustand): mock auth — creates a user on first login, persists to localStorage. Role is auto-assigned `"ADMIN"` if email contains "admin".
- **`useThemeStore`** (Zustand + persist): light/dark theme. Toggles `document.documentElement.classList` → `"dark"`. Applied on mount by `ThemeInitializer` in `providers.tsx`.
- **`usePresetsStore`** (Zustand): element presets array — load/save/remove. Backed by `LocalStoragePresetRepository` (key: `mailgen_element_presets`).
- **React Query** (`useTemplatesQuery`, `useCreateTemplateMutation`, `useDeleteTemplateMutation`): manages server state for template CRUD, keyed by `["templates", userId]`.

### Export Pipeline

`useExportBuilder.tsx` converts the `TemplateData` tree → React Email component tree → static HTML string:
1. `generateReactEmailElement(data, themeCSS)` — walks the node tree, maps each `EditorNodeType` to a `@react-email/components` element, injects CSS variables via a generated Tailwind config.
2. `generateHtmlExport(data, themeCSS)` — renders via `@react-email/render`, triggers a Blob download.
3. CSS variables from user-pasted Shadcn CSS are parsed by `application/utils/cssParser.ts` and scoped to `.email-editor-preview` in the canvas.
4. **CHART nodes**: Canvas renders Recharts interactively. Export uses `renderToStaticMarkup` to get an SVG string, encodes it as a data URI, and embeds it as `<Img>` in the email HTML.

### SSR Pattern (Public Templates)

`app/public-templates/page.tsx` demonstrates server prefetch + client hydration:
- Server component fetches via `serverTemplateService` (MockRepository) and dehydrates the React Query state.
- `HydrationBoundary` passes state to `PublicTemplateList` (client component).
- Client subsequently re-fetches via `apiTemplateService` (hits `/api/templates`).

## Key Conventions

- **Path alias**: `@/*` maps to `src/*`.
- **Shadcn config**: `components.json` — style `new-york`, Tailwind CSS variables, icons via `lucide-react`.
- **No test setup** exists yet — the project has no test runner configured. Playwright is installed as a devDependency.
- Editor components live in `src/components/organisms/Editor/` and consume `useEditorStore` directly.
- Drag-and-drop is handled by **dnd-kit** (`@dnd-kit/core`, `@dnd-kit/sortable`). The `editor/[id]/page.tsx` owns the `DndContext` and calls `addNode` / `moveNode` / `reorderNode` in `handleDragEnd`.
- **Dark mode**: `layout.tsx` has `suppressHydrationWarning` on `<html>`. CSS variables for dark mode are in `globals.css` under `.dark`.
- **TABLE UX**: `PropertiesPanel` renders individual cell inputs (not comma-separated). Headers and rows use grid layouts with per-cell inputs and trash buttons.
- **API security**: `send-test-email` route validates the request body with Zod, sanitizes 500 errors, and is rate-limited to 3 requests/min via TanStack Pacer.

## Element Presets Feature

- Bookmark icon in `PropertiesPanel` header saves the current node's props as a named preset.
- `Sidebar.tsx` has a collapsible "My Presets" section with `DraggablePresetBlock` components.
- Dragging a preset to the canvas uses `presetProps` instead of `getDefaultProps(type)` in `handleDragEnd`.
- Presets persist to localStorage via `LocalStoragePresetRepository`.

## Adding a New Node Type — Checklist

1. Add to `EditorNodeType` in `src/domain/models/Template.ts`
2. Add rendering case in `src/components/organisms/Editor/Canvas.tsx` (`NodeRenderer` switch)
3. Add properties panel section in `src/components/organisms/Editor/PropertiesPanel.tsx`
4. Add export case in `src/application/useExportBuilder.tsx`
5. Add `getDefaultProps` case in `src/app/editor/[id]/page.tsx`
6. Add to `BLOCKS` array in `src/components/organisms/Editor/Sidebar.tsx`
7. Add to `NODE_ICONS` in `src/app/editor/[id]/page.tsx`
