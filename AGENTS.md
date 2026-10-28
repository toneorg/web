<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Design system

The interface follows the tone design system, installed as `@toneorg/design` (github.com/toneorg/design).

- Before creating or changing any interface, read `node_modules/@toneorg/design/DESIGN.md`, then the sheet of the component you are touching in `node_modules/@toneorg/design/components/`. Both are in Portuguese.
- Color, type, radius, shadow and easing come from the package: Tailwind classes from `@toneorg/design/theme.css` (imported in `src/app/globals.css`), or `import { color } from "@toneorg/design"` where a class cannot reach (metadata, generated images). Never write a color by hand: `npm run check:design` fails, and CI runs it.
- A literal color is allowed only where it is data: the skin-tone scale in `src/lib/tones.ts`, listed under `allow` in `tone-design.json`.
- If a token or a component is missing, change it in `toneorg/design`, release a version and bump it here (`npm install github:toneorg/design#vX.Y.Z`). Do not add a local value.

## Where this page still differs from the reference

Checked on 2026-10-09 against v0.1.0. When you touch one of these, bring it to the reference and delete the line.

- Radii and text sizes are written as Tailwind built-ins and arbitrary values (`rounded-4xl`, `rounded-2xl`, `text-[0.9375rem]`), with the same sizes as the tokens. Use `rounded-tile`, `rounded-input` and `text-ui` when you touch the component.
- The checkbox row is 36px tall; the system's touch target is 44.
- The floating nav's shadow is written by hand, counted under `legacy` in `tone-design.json`.
