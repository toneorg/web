<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Design system

The interface follows the tone design system, installed as `@toneorg/design` (github.com/toneorg/design).

- Before creating or changing any interface, read `node_modules/@toneorg/design/DESIGN.md`, then the sheet of the component you are touching in `node_modules/@toneorg/design/components/`. Both are in Portuguese.
- Color, type, radius, shadow and easing come from the package: Tailwind classes from `@toneorg/design/theme.css` (imported in `src/app/globals.css`), or `import { color } from "@toneorg/design"` where a class cannot reach (metadata, generated images). Never write a color by hand: `npm run check:design` fails, and CI runs it.
- A literal color is allowed only where it is data (a product's color from the catalog), in a file listed under `allow` in `tone-design.json`. tone does not use skin tone to understand the person: no screen, scale or swatch of it.
- If a token or a component is missing, change it in `toneorg/design`, release a version and bump it here (`npm install github:toneorg/design#vX.Y.Z`). Do not add a local value.

## Where this page still differs from the reference

Checked on 2026-11-15 against v0.1.0. When you touch one of these, bring it to the reference and delete the line.

- The landing pages (`src/landing`, `src/app/page.tsx`, `src/app/lojas`) still write display text sizes as arbitrary values (`text-[1.5rem]`, `text-[1.0625rem]`). Use the type tokens when you touch them. The app (`src/conversas`) has none left.
