# Move Next.js App to Src Folder - Design

## Context

The project currently has a mix of root-level UI directories and `src/`-level components:

- `app/` is at root.
- `components/ui/` is at root.
- `lib/` is at root.
- Atomic design components (`atoms`, `molecules`, `organisms`, `templates`, `features`) are inside `src/components/`.

## Architecture & Proposal

We will adopt **Option 1**, unifying all frontend code inside `src/`. This provides better separation between application code and configuration files.

## Changes:

1. Move `app` -> `src/app`
2. Move `components/ui` -> `src/components/ui`
3. Move `lib` -> `src/lib`
4. Configurations:
   - `components.json`: update `tailwind.css` path to `src/app/globals.css`.
   - `tsconfig.json`: update `paths: { "@/*": ["./src/*"] }` to enforce resolution specifically inside `src/`.

## Testing

We will run `bun run build` to ensure the project compiles and all path aliases resolve correctly.
