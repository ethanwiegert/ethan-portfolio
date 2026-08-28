# Spec 02 — Starfield hero with shooting stars + blanket sections

## Constraints
- New deps: `three` and `@types/three` (dev). Nothing else.
- ALL hero code must be ORIGINAL, written from scratch in this task. Do not port, transcribe, or imitate any third-party shader or scene code, and do not read `.hermes/` reference material — a plain Three.js starfield you write yourself.
- Production build must stay green: `npm run build` and `npx tsc --noEmit` pass.
- Git END STATE: on `main`, clean tree, work committed as `feat: starfield hero with shooting stars + placeholder sections`.
- Mobile friendly and light/dark aware are hard requirements.

## Files

### 1. `src/components/starfield-hero.tsx` — `'use client'`
Full-viewport hero: a `<section>` with `min-height: 100svh` containing an absolutely positioned canvas layer behind centered text content (`pointer-events: none` on the canvas layer so the text/buttons stay clickable).

Three.js implementation inside `useEffect` (dynamic `import('three')` is fine):
- Renderer: antialias on; `devicePixelRatio` capped at `min(dpr, 2)`; resize handling (window resize → update camera aspect + renderer size + regenerate nothing).
- Strict cleanup on unmount: cancel the animation frame, `dispose()` every geometry/material/renderer created, remove all listeners/observers added.
- Theme-aware colors, live: read whether `<html>` has class `dark` (next-themes `attribute="class"`), and watch for changes with a `MutationObserver` on the `<html>` element's `class` attribute so toggling the theme updates the scene without a reload.
  - Dark: night sky — deep indigo/near-black background (e.g. `#050510`-ish), warm white/gold stars.
  - Light: soft pale dawn sky (light desaturated blue), stars in muted slate/soft gold — dimmer but still visible.
  - Meteors in light mode: paler, more subtle streaks; in dark mode bright white-gold.
- Star field: `THREE.Points` with roughly 1500–2500 stars spread across a wide, deep volume in front of a fixed camera; varied sizes; subtle per-star twinkle (per-star random phase, gentle sine modulation of brightness/size over time). Original GLSL only if you use a `ShaderMaterial`; `PointsMaterial` with vertex colors is also acceptable if twinkle is done another way (e.g. slight size oscillation via attribute update).
- Shooting stars — the headline feature:
  - A meteor spawns every 2.5–7 seconds (randomized interval — "every few seconds").
  - Each meteor: starts in the upper ~60% of the visible volume, moves on a random diagonal (clearly not axis-aligned) downward across ~40–70% of the sky over 0.9–1.6s, then fades out and is removed.
  - Rendering: a bright head plus a tapering trail. Implementation choice is yours (e.g. a `THREE.Line` with ~20–30 segments whose vertex alphas fade from head to tail, additive blending; head as a small bright point/sprite). Trail should persist and stretch behind the head, not be a static shape.
  - Never two meteors spawning within 800ms of each other; at most 2 concurrent.
- Performance / etiquette:
  - Pause the animation loop when `document.hidden`.
  - Pause when the hero is scrolled out of view (`IntersectionObserver` on the section).
  - `prefers-reduced-motion`: still render the static starfield, but do not spawn meteors and skip the twinkle animation.

### 2. `src/app/page.tsx` — restructure into the real page
- Hero: `<StarfieldHero>` containing the overlay content, centered: small eyebrow text (`Hi, I'm`), `<h1>` `Ethan`, one-line tagline `Building tools that make developers faster.` (placeholder — user will edit), and two shadcn buttons: primary `View projects` → `#projects`, ghost `Get in touch` → `#contact`.
- Blanket sections (intentionally sparse scaffolds the user will fill in later; consistent `max-w-3xl mx-auto px-…` container, clear spacing between sections, anchor ids preserved):
  - `#about` — `<h2>` About + 2 placeholder sentences.
  - `#projects` — `<h2>` Projects + a responsive grid (1 col mobile / 3 cols desktop) of 3 dashed-border placeholder cards labeled `Project coming soon`.
  - `#experience` — `<h2>` Experience + a simple vertical timeline skeleton with 3 empty entries (dot + line + placeholder role/date lines).
  - `#contact` — `<h2>` Contact + one placeholder card: `Contact details coming soon` with a disabled-looking `Button` stub.
- Keep `<SiteHeader />` / `<SiteFooter />` as-is. Nav anchors from spec 01 must still resolve.

## Verify (all must pass)
- `npm run build`
- `npx tsc --noEmit`
- Dev server returns 200 at `/` and the HTML contains `Ethan` and `Projects`.
- Stop the dev server afterward.

## Report back
- Files + approximate line counts
- How meteor scheduling works (constants chosen)
- How theme changes are detected at runtime
- Verify results
- Any deviations from this spec and why