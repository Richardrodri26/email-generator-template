# Move App Folder Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Unify the application file structure by moving the Next.js `app` router, `components`, and `lib` directories into `src/`.

**Architecture:** We will re-locate the frontend folders from the project root into `src/` and adjust `tsconfig.json` and `components.json` routing aliases to reflect this change.

**Tech Stack:** Next.js 15, Tailwind CSS 4, Typescript

---

### Task 1: Move Directories

**Files:**

- Move: `app/` -> `src/app/`
- Move: `lib/` -> `src/lib/`
- Move: `components/ui/` -> `src/components/ui/`
- Remove: `components/` from root (if empty)

**Step 1: Move directory structure**

```bash
mv app src/app
mv lib src/lib
mv components/ui src/components/ui
rm -rf components
```

**Step 2: Commit**

```bash
git add src/app src/lib src/components app lib components
git commit -m "refactor: unify file structure by moving app, lib, and ui to src"
```

### Task 2: Config Updates

**Files:**

- Modify: `components.json`
- Modify: `tsconfig.json`

**Step 1: Update components.json**
Change tailwind CSS path in `components.json` to reflect `src/app/globals.css`.

**Step 2: Update tsconfig.json paths**
Change the wildcard alias to exclusively resolve from `src/*`.

```json
"paths": {
  "@/*": ["./src/*"]
}
```

**Step 3: Commit**

```bash
git add components.json tsconfig.json
git commit -m "chore: align configuration to src directory paths"
```

### Task 3: Verify the Build

**Step 1: Verify types**
Run: `bun run typecheck` or `bunx tsc --noEmit`
Expected: PASS

**Step 2: Build the project**
Run: `bun run build`
Expected: Successful compilation without module resolution errors.
