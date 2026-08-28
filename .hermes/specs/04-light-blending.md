# Spec 04 — Fix light-mode star rendering: per-theme blending

## Problem (found in browser verification)
The star field and meteor trails use `THREE.AdditiveBlending` in BOTH themes. In light mode the sky is pale (#dbe4ee, luminance ~227), so additive blending clamps every star to white — the new darker light-mode palette (#52606f etc., luminance ~95) can never render darker than the sky. Measured: 0% of canvas pixels are darker than the sky; stars read as washed-out white sparkles.

## Fix — in `src/components/starfield-hero.tsx` only
1. Star field material: choose the blending mode per theme.
   - Dark theme: keep `THREE.AdditiveBlending` (unchanged look).
   - Light theme: use `THREE.NormalBlending` so the darker slate/amber star colors alpha-blend ON TOP of the pale sky as distinct darker points.
   - This must be applied live on theme change (the existing `applyTheme()` / MutationObserver path already regenerates star colors — set `starMat.blending` and `starMat.needsUpdate = true` there too, or set it at material creation + update in applyTheme).
   - With NormalBlending the `uStarOpacity` for light mode should be retuned (alpha blending at 1.7 opacity would look heavy) — pick a value that keeps stars clearly visible but not blotchy (e.g. 1.0–1.3). Exact value your call.
2. Meteor trails: same per-theme treatment — `AdditiveBlending` in dark, `NormalBlending` in light (trail color #a98a4a on pale sky reads as a warm streak). Spawn-time theme selection is already implemented; just pick blending per `currentTheme` when creating `lineMat`. Existing in-flight meteors may keep their blending until they expire (acceptable).
3. Meteor heads: keep additive in both themes (bright head is desired).
4. Dark mode must remain visually unchanged.

## Verify (all must pass)
- `npm run build` and `npx tsc --noEmit`
- Dev server 200 at `/`; stop it afterward.

## Report back
- Blending values chosen per theme, any uniform retuning
- Verify results
- Deviations and why