# UI Design Implementation Plan: "Mocha & Amber"

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement the "Mocha & Amber" soft and cozy aesthetic by updating Tailwind and Shadcn UI variables, adding the Outfit font, and restructuring the colors of the Navbar, Sidebar, and Canvas.

**Architecture:** We will modify `src/app/globals.css` to update the OKLCH theme variables for both light and dark modes. We will update `src/app/layout.tsx` to load and apply the `Outfit` font for headings. Finally, we will update the specific components (`Navbar`, `Sidebar` equivalent, and `Canvas` equivalent) to use the new semantic classes.

**Tech Stack:** Next.js 15, Tailwind CSS 4, Shadcn UI, React 19.

---

### Task 1: Update Typography in Layout

**Files:**

- Modify: `src/app/layout.tsx`

**Step 1: Write the minimal implementation**

```tsx
// src/app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono, Outfit } from "next/font/google"; // Added Outfit
import "./globals.css";
import { Navbar } from "@/components/organisms/Navbar";
import { Providers } from "@/components/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Add Outfit font configurations
const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Email Generator",
  description: "Create beautiful emails easily.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {/* Add outfit.variable to the body className */}
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${outfit.variable} antialiased min-h-screen flex flex-col bg-background`}
      >
        <Providers>
          <Navbar />
          <main className="flex-1 flex flex-col relative w-full overflow-hidden bg-background">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
```

**Step 2: Commit**

```bash
git add src/app/layout.tsx
git commit -m "feat(ui): add Outfit font to layout"
```

---

### Task 2: Update CSS Variables for Mocha & Amber Theme

**Files:**

- Modify: `src/app/globals.css`

**Step 1: Write the minimal implementation**

_Replace the existing `:root` and `.dark` blocks with the new OKLCH values._
_(Note: OKLCH values here are approximations of the described Hex colors for standard Tailwind 4 / Shadcn compatibility)._

```css
/* src/app/globals.css - partial replacement */
@theme inline {
  /* ... keep existing theme variables, add font-heading ... */
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
  --font-heading: var(--font-outfit); /* New variable */
  /* ... keep the rest ... */
}

:root {
  /* Light Mode (Cream/Bone with Amber) */
  --background: oklch(0.985 0.002 86); /* #fafaf9 stone-50 */
  --foreground: oklch(0.145 0 0);
  --card: oklch(1 0 0); /* white */
  --card-foreground: oklch(0.145 0 0);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.145 0 0);
  --primary: oklch(0.643 0.17 56.4); /* #d97706 amber-600 */
  --primary-foreground: oklch(0.98 0.02 86); /* #fffbeb */
  --secondary: oklch(0.97 0 0);
  --secondary-foreground: oklch(0.205 0 0);
  --muted: oklch(0.966 0.002 86); /* stone-100 */
  --muted-foreground: oklch(0.551 0.01 86); /* stone-500 */
  --accent: oklch(0.966 0.002 86);
  --accent-foreground: oklch(0.205 0 0);
  --destructive: oklch(0.577 0.245 27.325);
  --border: oklch(0.925 0.004 86); /* stone-200 */
  --input: oklch(0.925 0.004 86);
  --ring: oklch(0.643 0.17 56.4); /* primary */
  --radius: 0.5rem; /* softer corners */
  /* ... keep charts and sidebar ... */
}

.dark {
  /* Dark Mode (Mocha & Amber) */
  --background: oklch(0.208 0.004 86); /* #1c1917 stone-900 */
  --foreground: oklch(0.985 0.002 86);
  --card: oklch(0.264 0.005 86); /* #292524 stone-800 */
  --card-foreground: oklch(0.985 0.002 86);
  --popover: oklch(0.264 0.005 86);
  --popover-foreground: oklch(0.985 0.002 86);
  --primary: oklch(0.643 0.17 56.4); /* #d97706 amber-600 */
  --primary-foreground: oklch(0.98 0.02 86);
  --secondary: oklch(0.323 0.005 86); /* stone-700 */
  --secondary-foreground: oklch(0.985 0.002 86);
  --muted: oklch(0.264 0.005 86);
  --muted-foreground: oklch(0.707 0.01 86); /* stone-400 */
  --accent: oklch(0.323 0.005 86);
  --accent-foreground: oklch(0.985 0.002 86);
  --destructive: oklch(0.704 0.191 22.216);
  --border: oklch(0.323 0.005 86); /* stone-700 */
  --input: oklch(0.323 0.005 86);
  --ring: oklch(0.643 0.17 56.4);
  /* ... keep charts and sidebar ... */
}

/* Also add the utility to force headings to use the new font */
@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
  }
  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    font-family: var(--font-heading);
  }
}
```

**Step 2: Commit**

```bash
git add src/app/globals.css
git commit -m "style(ui): apply mocha and amber theme colors and heading font"
```

---

### Task 3: Verify Canvas and Sidebar Base Styles

_(Note: We assume structural layout components like `Navbar` and a `Sidebar` exist. They should use `bg-card` for panels and `bg-background` for the main app background)._

**Files:**

- Modify: Identify main layout/page components (e.g., `src/app/page.tsx`, `src/app/editor/page.tsx`, etc.).

**Step 1: Write the minimal implementation (General Guideline)**

- Ensure the main wrapping `div` of the editor uses `bg-background`.
- Ensure the sidebar/tools panels use `bg-card border-r border-border`.
- Ensure the actual "Email" preview container uses `bg-white dark:bg-zinc-100` (or purely `bg-white` forcing light mode on the mail itself so it looks realistic).

_If existing components already use standard Shadcn classes (`bg-card`, etc.), no major changes might be needed besides checking the Email preview container._

**Step 2: Run test to verify it passes**

Run the dev server and manually inspect the aesthetic:
Run: `npm run dev`
Expected: The application should render with the dark warm Mocha background, amber accents, and Outfit headings.

**Step 3: Commit**

```bash
git commit -am "style(ui): ensure layout components use semantic background colors"
```
