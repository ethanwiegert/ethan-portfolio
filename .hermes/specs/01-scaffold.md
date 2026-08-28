# Spec 01 — Scaffold the portfolio site

## Constraints
- Stack: Next.js (App Router, TypeScript, Tailwind), shadcn/ui, next-themes. No other runtime deps in this spec.
- CWD is the repo root: /home/ethan/Documents/dev-projects/Portfolio (already contains `.hermes/`).
- Do NOT reference, read, or reuse anything in `.hermes/` other than this spec — all code must be written fresh.
- CLI flags drift between versions: before running `create-next-app` or `shadcn`, check `--help` and adapt (do not copy flags from memory or old docs). Use non-interactive/default answers wherever possible.
- Git END STATE (not steps): repo exists, branch is `main`, working tree clean, all work committed.

## Steps
1. The directory is non-empty (`.hermes/` lives here), and create-next-app refuses non-empty dirs. Workaround:
   - `npx create-next-app@latest scaffold-tmp` with TS + Tailwind + ESLint + App Router + src dir + `@/*` import alias, npm, no turbopack (adjust flags per `--help`).
   - `shopt -s dotglob && mv scaffold-tmp/* . && rmdir scaffold-tmp`
   - Fix `package.json` `"name"` to `"portfolio"`.
2. `npx shadcn@latest init` (defaults; if it asks for a base color choose `neutral`), then `npx shadcn@latest add button`.
3. `npm i next-themes`
4. Create/modify these files:
   - `src/app/providers.tsx` — `'use client'`; wrap children in `ThemeProvider` from `next-themes` with `attribute="class"`, `defaultTheme="dark"`, `enableSystem`.
   - `src/app/layout.tsx` — wrap children in `<Providers>`; `<html suppressHydrationWarning>`; metadata: title `Ethan — Portfolio`, short description.
   - `src/components/theme-toggle.tsx` — `'use client'`; shadcn `Button` variant `ghost` size `icon`; toggles `dark`/`light` via `useTheme`; inline SVG sun/moon icons (original, simple); `aria-label="Toggle theme"`; must not render mismatched icon during SSR (guard with a mounted check).
   - `src/components/site-header.tsx` — sticky top, subtle backdrop blur + border; left: text wordmark `Ethan` (text only, no glyph/logo image); right: nav anchors `About`, `Projects`, `Experience`, `Contact` (links to `#about` etc.) + the theme toggle. On small screens the nav links may collapse to just the toggle — keep it simple and responsive.
   - `src/components/site-footer.tsx` — single line: `© {current year} Ethan`.
   - `src/app/page.tsx` — renders `<SiteHeader />`, `<main>` containing placeholder `<section>` blocks for hero/about/projects/experience/contact (each just an `<h2>` + one placeholder sentence for now — real content comes in spec 02), and `<SiteFooter />`.
   - `src/app/globals.css` — shadcn CSS variables restyled to a personal palette: primary/accent = ember `#8C2312` (warm dark red), highlight = gold `#FFB25E`; light mode = warm cream/sand paper feel; dark mode = deep warm near-black (not pure black). Keep contrast accessible (text remains readable on both).
5. Verify (all must pass):
   - `npm run build`
   - `npx tsc --noEmit`
   - start dev server, `curl -sf http://localhost:3000/` returns HTML containing `Ethan`
   - stop the dev server afterward.
6. Commit everything on `main` with message `scaffold: next.js + shadcn + theming`; leave a clean tree.

## Report back
- Files created/modified (paths)
- Versions: next, react, tailwind, shadcn, next-themes
- Verify results (build/tsc/curl pass-fail)
- Any deviations from this spec and why