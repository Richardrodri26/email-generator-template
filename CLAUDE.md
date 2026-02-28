# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server (Next.js with Turbopack)
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

Add Shadcn components: `npx shadcn add <component>`

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
  type: EditorNodeType                // ROOT | TEXT | BUTTON | IMAGE | CONTAINER | ...
  props: Record<string, any>          // styling + content merged
  children: string[]                  // ordered child IDs
}
```

The tree is traversed recursively by `Canvas.tsx` and `useExportBuilder.tsx`. All mutations go through `useEditorStore` (Zustand + Immer), which also maintains an undo/redo history stack.

### State Management
- **`useEditorStore`** (Zustand + Immer): editor tree state, selection, full undo/redo history.
- **`useAuth`** (Zustand): mock auth — creates a user on first login, persists to localStorage. Role is auto-assigned `"ADMIN"` if email contains "admin".
- **React Query** (`useTemplatesQuery`, `useCreateTemplateMutation`, `useDeleteTemplateMutation`): manages server state for template CRUD, keyed by `["templates", userId]`.

### Export Pipeline

`useExportBuilder.tsx` converts the `TemplateData` tree → React Email component tree → static HTML string:
1. `generateReactEmailElement(data, themeCSS)` — walks the node tree, maps each `EditorNodeType` to a `@react-email/components` element, injects CSS variables via a generated Tailwind config.
2. `generateHtmlExport(data, themeCSS)` — renders via `@react-email/render`, triggers a Blob download.
3. CSS variables from user-pasted Shadcn CSS are parsed by `application/utils/cssParser.ts` and scoped to `.email-editor-preview` in the canvas.

### SSR Pattern (Public Templates)

`app/public-templates/page.tsx` demonstrates server prefetch + client hydration:
- Server component fetches via `serverTemplateService` (MockRepository) and dehydrates the React Query state.
- `HydrationBoundary` passes state to `PublicTemplateList` (client component).
- Client subsequently re-fetches via `apiTemplateService` (hits `/api/templates`).

## Key Conventions

- **Path alias**: `@/*` maps to `src/*`.
- **Shadcn config**: `components.json` — style `new-york`, Tailwind CSS variables, icons via `lucide-react`.
- **No test setup** exists yet — the project has no test runner configured.
- Editor components live in `src/components/organisms/Editor/` and consume `useEditorStore` directly.
- Drag-and-drop is handled by **dnd-kit** (`@dnd-kit/core`, `@dnd-kit/sortable`). The `editor/[id]/page.tsx` owns the `DndContext` and calls `addNode` / `moveNode` / `reorderNode` in `handleDragEnd`.
