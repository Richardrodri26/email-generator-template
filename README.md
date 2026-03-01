# MailGen — Email Template Builder

A visual drag-and-drop email template editor built with Next.js 16, React 19, and React Email. Design responsive, production-ready email templates through a WYSIWYG canvas and export them as clean, client-compatible HTML.

## Features

- **13 node types**: Text, Button, Image, Container, Divider, Spacer, Columns, Social, Card, Table, Badge, Chart, and Root layout
- **Visual editor**: Drag-and-drop canvas with dnd-kit, live property panel, and multi-level undo/redo
- **Export pipeline**: Converts the visual tree to `@react-email/components` → static HTML with a single click
- **Send test emails**: Integrated Resend API support — send to any address directly from the editor toolbar
- **Element presets**: Bookmark any configured node as a reusable preset, draggable from the sidebar
- **Dark mode**: Full light/dark theme with Shadcn CSS variable theming
- **PDF export**: Download templates as PDF via html2canvas + jsPDF
- **Responsive preview**: Toggle between desktop and mobile viewport widths in the canvas
- **Template management**: Dashboard with search, sort, duplicate, and rename — persisted to localStorage

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, Turbopack) |
| UI | React 19, Tailwind CSS 4, Shadcn/ui (new-york) |
| State | Zustand 5 + Immer (editor, auth, theme, presets) |
| Server state | TanStack Query v5 |
| Drag-and-drop | dnd-kit |
| Email rendering | @react-email/components, @react-email/render |
| Charts | Recharts (SVG → data URI in export) |
| Email delivery | Resend |
| Forms | TanStack Form + Zod 4 |
| Rate limiting | TanStack Pacer |

## Getting Started

```bash
# Install dependencies
bun install

# Start development server (Turbopack)
bun run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Commands

```bash
bun run dev      # Start dev server (Next.js with Turbopack)
bun run build    # Production build
bun run start    # Start production server
bun run lint     # Run ESLint

npx shadcn add <component>   # Add a Shadcn component
```

## Architecture

Hexagonal Architecture (Ports & Adapters) — strict 4-layer separation:

```
src/
├── domain/          # Pure types + repository interfaces — zero external deps
├── infrastructure/  # Concrete implementations (LocalStorage, Mock, API, React Query hooks)
├── application/     # Business logic: services, Zustand stores, custom hooks
├── components/      # UI: organisms/, features/, ui/ (Shadcn), providers.tsx
├── config/          # services.ts — DI composition root
└── app/             # Next.js App Router: routes + API endpoints
```

### Template Data Model

The canvas state is a **flattened tree** stored in a dictionary — no nested objects, just ID references:

```typescript
TemplateData {
  rootNodeId: string
  nodes: Record<string, EditorNode>   // flat map, ID → node
}

EditorNode {
  id: string
  type: EditorNodeType                // ROOT | TEXT | BUTTON | IMAGE | ...
  props: Record<string, any>          // styling + content merged
  children: string[]                  // ordered child IDs
}
```

### Repository Strategies

Three pre-wired service instances live in `src/config/services.ts`:

| Instance | Repository | Used by |
|----------|-----------|---------|
| `localTemplateService` | LocalStorageTemplateRepository | Client dashboard |
| `serverTemplateService` | MockTemplateRepository | SSR / server components |
| `apiTemplateService` | ApiTemplateRepository | Client → `/api/templates` |

### Export Pipeline

`useExportBuilder.tsx` → `@react-email/components` → static HTML:

1. Walk the node tree, map each `EditorNodeType` to a React Email element
2. Parse user-pasted Shadcn CSS variables, inject into the email as a Tailwind config
3. `CHART` nodes are rendered via Recharts `renderToStaticMarkup` → SVG → data URI `<Img>`
4. `generateHtmlExport()` calls `@react-email/render` and triggers a Blob download

## Project Structure (key files)

```
src/
├── domain/models/Template.ts              # EditorNodeType + EditorNode + TemplateData
├── domain/models/Preset.ts               # ElementPreset interface
├── application/useEditorStore.ts         # Zustand: editor tree, selection, undo/redo
├── application/useExportBuilder.tsx      # Tree → HTML export pipeline
├── application/useThemeStore.ts          # Zustand: light/dark theme
├── application/usePresetsStore.ts        # Zustand: element presets
├── application/utils/cssParser.ts        # Parses Shadcn CSS variables
├── components/organisms/Editor/
│   ├── Canvas.tsx                        # Node renderers (switch per type)
│   ├── PropertiesPanel.tsx               # Property editors + Bookmark button
│   └── Sidebar.tsx                       # BLOCKS + DraggablePresetBlock
├── app/editor/[id]/page.tsx              # DndContext, getDefaultProps(), handleDragEnd
├── app/dashboard/page.tsx                # Template list + management
└── app/api/
    ├── templates/                        # CRUD endpoints
    └── send-test-email/                  # Resend integration (rate-limited 3/min)
```

## Environment Variables

```env
# .env.local
# No required env vars for local development (uses localStorage)
# Optional: Resend API key can be entered per-session in the editor UI
```
